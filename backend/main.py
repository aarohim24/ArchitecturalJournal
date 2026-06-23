import logging
import io
import os
import uuid
import shutil
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import (
    Writing, WritingImage,
    Fragment, FragmentImage,
    VisualStory, VisualStoryImage,
    AboutContent, SiteSettings,
)

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────

UPLOAD_DIR = "uploads"
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")
USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_CLOUD_NAME"))

# ── Startup ────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not ADMIN_SECRET:
        logger.warning(
            "ADMIN_SECRET is not set. All write endpoints are unprotected. "
            "Set ADMIN_SECRET in your environment to secure the API."
        )
    if not USE_CLOUDINARY:
        logger.warning(
            "CLOUDINARY_CLOUD_NAME is not set. Files will be stored locally. "
            "On ephemeral hosts (Render free tier), uploads are lost on redeploy."
        )
    yield

# ── App setup ──────────────────────────────────────────────────────────────────

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Architecture in Fragments API", lifespan=lifespan)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
_allowed_origins: set[str] = {
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
}
if FRONTEND_URL:
    _allowed_origins.add(FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cloudinary ─────────────────────────────────────────────────────────────────

if USE_CLOUDINARY:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    )

if not USE_CLOUDINARY:
    os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)
    os.makedirs(f"{UPLOAD_DIR}/visual_stories", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ── Auth dependency ────────────────────────────────────────────────────────────

def require_admin(x_admin_key: Optional[str] = Header(None)) -> None:
    """Verify the X-Admin-Key request header for all write endpoints."""
    if not ADMIN_SECRET:
        return  # warn-only mode when ADMIN_SECRET is not configured
    if x_admin_key != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin key.",
        )


# ── File helpers ───────────────────────────────────────────────────────────────

def _is_valid_image_bytes(header: bytes) -> bool:
    """Confirm file is a supported image by inspecting its magic bytes."""
    if header[:3] == b"\xff\xd8\xff":
        return True  # JPEG
    if header[:8] == b"\x89PNG\r\n\x1a\n":
        return True  # PNG
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return True  # GIF
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return True  # WebP
    return False


def is_valid_upload(file: Optional[UploadFile]) -> bool:
    return file is not None and bool(file.filename)


async def validate_image(file: UploadFile) -> None:
    """Raise HTTP 400/413 if the upload is not a valid image or exceeds 10 MB."""
    header = await file.read(12)
    await file.seek(0)
    if not header or not _is_valid_image_bytes(header):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{file.filename}' is not a supported image (JPEG, PNG, GIF, WebP).",
        )
    
    # Safely get the file size across different Starlette/FastAPI versions
    file_size = getattr(file, "size", None)
    if file_size is None:
        try:
            # Fallback: seek to the end of the underlying file object to determine size
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception:
            file_size = None

    if file_size and file_size > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 10 MB size limit.",
        )


async def save_file(file: UploadFile, subfolder: str = "images") -> str:
    """Read the entire upload into memory, then persist.

    * await file.read() gives us a clean, position-independent bytes buffer.
    * io.BytesIO(content) avoids every SpooledTemporaryFile issue.
    * run_in_threadpool keeps the blocking Cloudinary network call off the
      async event loop (direct call blocks uvicorn and can cause crashes).
    * The try/except converts any Cloudinary SDK exception into a proper
      HTTP 500 whose *detail* field surfaces the real error so the UI shows
      something meaningful instead of a generic "failed to fetch".
    """
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file appears to be empty.",
        )

    if USE_CLOUDINARY:
        buf = io.BytesIO(content)  # fresh buffer — position 0, no fileno() issue
        try:
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                buf,
                folder=f"architecture-journal/{subfolder}",
                resource_type="image",
            )
        except Exception as exc:
            logger.error("Cloudinary upload failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image storage failed — {exc}",
            )
        return result["secure_url"]

    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, subfolder, filename)
    with open(path, "wb") as buffer:
        buffer.write(content)
    return f"/uploads/{subfolder}/{filename}"

# ── Serialiser helpers ─────────────────────────────────────────────────────────

def _serialize_writing(w: Writing) -> dict:
    return {
        "id": w.id,
        "title": w.title,
        "subtitle": w.subtitle,
        "summary": w.summary,
        "content": w.content,
        "cover_image": w.cover_image,
        "featured": w.featured,
        "created_at": w.created_at,
        "updated_at": w.updated_at,
        "supporting_images": [
            {"id": img.id, "image_path": img.image_path,
             "caption": img.caption, "order": img.order}
            for img in w.supporting_images
        ],
    }


def _serialize_fragment(f: Fragment) -> dict:
    # Backfill: if new cover_image is absent but legacy image is present, surface it
    cover = f.cover_image or f.image
    return {
        "id": f.id,
        "title": f.title,
        "subtitle": f.subtitle,
        "text": f.text,
        "cover_image": cover,
        "image": f.image,  # kept for legacy clients
        "created_at": f.created_at,
        "updated_at": f.updated_at,
        "supporting_images": [
            {"id": img.id, "image_path": img.image_path,
             "caption": img.caption, "order": img.order}
            for img in f.supporting_images
        ],
    }


def _serialize_story(s: VisualStory) -> dict:
    return {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "images": [
            {"id": img.id, "image_path": img.image_path,
             "caption": img.caption, "order": img.order}
            for img in s.images
        ],
    }


def _serialize_about(a: AboutContent) -> dict:
    return {
        "id": a.id,
        "heading": a.heading,
        "body": a.body,
        "author_image": a.author_image,
        "updated_at": a.updated_at,
    }


def _serialize_settings(s: SiteSettings) -> dict:
    return {
        "id": s.id,
        "hero_image": s.hero_image,
        "updated_at": s.updated_at,
    }


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# ── Writings ───────────────────────────────────────────────────────────────────

@app.get("/api/writings")
def list_writings(featured: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Writing).order_by(Writing.created_at.desc())
    if featured is not None:
        q = q.filter(Writing.featured == featured)
    return [_serialize_writing(w) for w in q.all()]


@app.get("/api/writings/{writing_id}")
def get_writing(writing_id: int, db: Session = Depends(get_db)):
    w = db.query(Writing).filter(Writing.id == writing_id).first()
    if not w:
        raise HTTPException(404, "Writing not found")
    return _serialize_writing(w)


@app.post("/api/writings", dependencies=[Depends(require_admin)])
async def create_writing(
    title: str = Form(...),
    subtitle: str = Form(None),
    summary: str = Form(...),
    content: str = Form(...),
    featured: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
    supporting_images: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if is_valid_upload(cover_image):
        await validate_image(cover_image)
        image_url = await save_file(cover_image, "images")
    w = Writing(
        title=title, subtitle=subtitle, summary=summary,
        content=content, featured=featured, cover_image=image_url,
    )
    db.add(w)
    db.flush()

    if supporting_images:
        for i, img_file in enumerate(supporting_images):
            if not is_valid_upload(img_file):
                continue
            await validate_image(img_file)
            url = await save_file(img_file, "images")
            db.add(WritingImage(writing_id=w.id, image_path=url, order=i))

    db.commit()
    db.refresh(w)
    return _serialize_writing(w)


@app.put("/api/writings/{writing_id}", dependencies=[Depends(require_admin)])
async def update_writing(
    writing_id: int,
    title: str = Form(...),
    subtitle: str = Form(None),
    summary: str = Form(...),
    content: str = Form(...),
    featured: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
    supporting_images: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    w = db.query(Writing).filter(Writing.id == writing_id).first()
    if not w:
        raise HTTPException(404, "Writing not found")
    w.title = title
    w.subtitle = subtitle
    w.summary = summary
    w.content = content
    w.featured = featured
    if is_valid_upload(cover_image):
        await validate_image(cover_image)
        w.cover_image = await save_file(cover_image, "images")

    if supporting_images:
        current_count = len(w.supporting_images)
        for i, img_file in enumerate(supporting_images):
            if not is_valid_upload(img_file):
                continue
            await validate_image(img_file)
            url = await save_file(img_file, "images")
            db.add(WritingImage(writing_id=w.id, image_path=url, order=current_count + i))

    db.commit()
    db.refresh(w)
    return _serialize_writing(w)


@app.delete("/api/writings/{writing_id}", dependencies=[Depends(require_admin)])
def delete_writing(writing_id: int, db: Session = Depends(get_db)):
    w = db.query(Writing).filter(Writing.id == writing_id).first()
    if not w:
        raise HTTPException(404, "Writing not found")
    db.delete(w)
    db.commit()
    return {"ok": True}


# ── Fragments ──────────────────────────────────────────────────────────────────

@app.get("/api/fragments")
def list_fragments(db: Session = Depends(get_db)):
    return [_serialize_fragment(f)
            for f in db.query(Fragment).order_by(Fragment.created_at.desc()).all()]


@app.get("/api/fragments/{fragment_id}")
def get_fragment(fragment_id: int, db: Session = Depends(get_db)):
    f = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not f:
        raise HTTPException(404, "Fragment not found")
    return _serialize_fragment(f)


@app.post("/api/fragments", dependencies=[Depends(require_admin)])
async def create_fragment(
    text: str = Form(...),
    title: str = Form(None),
    subtitle: str = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    supporting_images: list[UploadFile] = File(None),
    # Legacy field kept for backwards compatibility
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    cover_url = None
    if is_valid_upload(cover_image):
        await validate_image(cover_image)
        cover_url = await save_file(cover_image, "images")
    elif is_valid_upload(image):
        await validate_image(image)
        cover_url = await save_file(image, "images")

    f = Fragment(title=title, subtitle=subtitle, text=text,
                 cover_image=cover_url, image=cover_url)
    db.add(f)
    db.flush()

    if supporting_images:
        for i, img_file in enumerate(supporting_images):
            if not is_valid_upload(img_file):
                continue
            await validate_image(img_file)
            url = await save_file(img_file, "images")
            db.add(FragmentImage(fragment_id=f.id, image_path=url, order=i))

    db.commit()
    db.refresh(f)
    return _serialize_fragment(f)


@app.put("/api/fragments/{fragment_id}", dependencies=[Depends(require_admin)])
async def update_fragment(
    fragment_id: int,
    text: str = Form(...),
    title: str = Form(None),
    subtitle: str = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    supporting_images: list[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    f = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not f:
        raise HTTPException(404, "Fragment not found")
    f.title = title
    f.subtitle = subtitle
    f.text = text
    if is_valid_upload(cover_image):
        await validate_image(cover_image)
        url = await save_file(cover_image, "images")
        f.cover_image = url
        f.image = url
    elif is_valid_upload(image):
        await validate_image(image)
        url = await save_file(image, "images")
        f.cover_image = url
        f.image = url

    if supporting_images:
        current_count = len(f.supporting_images)
        for i, img_file in enumerate(supporting_images):
            if not is_valid_upload(img_file):
                continue
            await validate_image(img_file)
            url = await save_file(img_file, "images")
            db.add(FragmentImage(fragment_id=f.id, image_path=url, order=current_count + i))

    db.commit()
    db.refresh(f)
    return _serialize_fragment(f)


@app.delete("/api/fragments/{fragment_id}", dependencies=[Depends(require_admin)])
def delete_fragment(fragment_id: int, db: Session = Depends(get_db)):
    f = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not f:
        raise HTTPException(404, "Fragment not found")
    db.delete(f)
    db.commit()
    return {"ok": True}


# ── Visual Stories ─────────────────────────────────────────────────────────────

@app.get("/api/visual-stories")
def list_visual_stories(db: Session = Depends(get_db)):
    stories = db.query(VisualStory).order_by(VisualStory.created_at.desc()).all()
    return [_serialize_story(s) for s in stories]


@app.get("/api/visual-stories/{story_id}")
def get_visual_story(story_id: int, db: Session = Depends(get_db)):
    s = db.query(VisualStory).filter(VisualStory.id == story_id).first()
    if not s:
        raise HTTPException(404, "Visual story not found")
    return _serialize_story(s)


@app.post("/api/visual-stories", dependencies=[Depends(require_admin)])
async def create_visual_story(
    title: str = Form(...),
    description: str = Form(None),
    images: list[UploadFile] = File(None),
    captions: list[str] = Form(None),
    db: Session = Depends(get_db),
):
    story = VisualStory(title=title, description=description)
    db.add(story)
    db.flush()

    if images:
        caps = captions or []
        for i, img_file in enumerate(images):
            if not is_valid_upload(img_file):
                continue
            await validate_image(img_file)
            url = await save_file(img_file, "visual_stories")
            caption = caps[i] if i < len(caps) else None
            story_img = VisualStoryImage(
                story_id=story.id, image_path=url, caption=caption, order=i
            )
            db.add(story_img)

    db.commit()
    db.refresh(story)
    return _serialize_story(story)


@app.put("/api/visual-stories/{story_id}", dependencies=[Depends(require_admin)])
async def update_visual_story(
    story_id: int,
    title: str = Form(...),
    description: str = Form(None),
    db: Session = Depends(get_db),
):
    """Update the title and description of an existing visual story."""
    s = db.query(VisualStory).filter(VisualStory.id == story_id).first()
    if not s:
        raise HTTPException(404, "Visual story not found")
    s.title = title
    s.description = description
    db.commit()
    db.refresh(s)
    return _serialize_story(s)


@app.delete("/api/visual-stories/{story_id}", dependencies=[Depends(require_admin)])
def delete_visual_story(story_id: int, db: Session = Depends(get_db)):
    s = db.query(VisualStory).filter(VisualStory.id == story_id).first()
    if not s:
        raise HTTPException(404, "Visual story not found")
    db.delete(s)
    db.commit()
    return {"ok": True}


# ── About ──────────────────────────────────────────────────────────────────────

@app.get("/api/about")
def get_about(db: Session = Depends(get_db)):
    a = db.query(AboutContent).first()
    if not a:
        return {
            "id": None,
            "heading": "Architecture in Fragments",
            "body": "A spatial journal exploring the quiet moments of architecture and spatial experience.",
            "author_image": None,
            "updated_at": None,
        }
    return _serialize_about(a)


@app.put("/api/about", dependencies=[Depends(require_admin)])
async def update_about(
    heading: str = Form(...),
    body: str = Form(...),
    author_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    a = db.query(AboutContent).first()
    if not a:
        a = AboutContent(heading=heading, body=body)
        db.add(a)
    else:
        a.heading = heading
        a.body = body
    if is_valid_upload(author_image):
        await validate_image(author_image)
        a.author_image = await save_file(author_image, "images")
    db.commit()
    db.refresh(a)
    return _serialize_about(a)


# ── Site Settings ──────────────────────────────────────────────────────────────

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    s = db.query(SiteSettings).first()
    if not s:
        return {"id": None, "hero_image": None, "updated_at": None}
    return _serialize_settings(s)


@app.put("/api/settings/hero-image", dependencies=[Depends(require_admin)])
async def update_hero_image(
    hero_image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not is_valid_upload(hero_image):
        raise HTTPException(400, "No valid image provided")
    await validate_image(hero_image)
    url = await save_file(hero_image, "images")
    s = db.query(SiteSettings).first()
    if not s:
        s = SiteSettings(hero_image=url)
        db.add(s)
    else:
        s.hero_image = url
    db.commit()
    db.refresh(s)
    return _serialize_settings(s)

#genai
import os
import uuid
import shutil
from datetime import datetime, timezone

from dotenv import load_dotenv #genai
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional

from database import engine, get_db, Base
from models import Writing, Fragment, VisualStory, VisualStoryImage, AboutContent, SiteSettings

Base.metadata.create_all(bind=engine)

USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_CLOUD_NAME"))

if USE_CLOUDINARY:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    )

app = FastAPI(title="Architecture in Fragments API")


@app.get("/api/health") #genai
def health_check():
    return {"status": "ok"}

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173") #genai

allowed_origins = {"http://localhost:5173", "http://localhost:3000"} #genai
if FRONTEND_URL:
    allowed_origins.add(FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not USE_CLOUDINARY:
    os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)
    os.makedirs(f"{UPLOAD_DIR}/visual_stories", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def is_valid_upload(file: Optional[UploadFile]) -> bool:
    return file is not None and file.filename and file.size and file.size > 0


def save_file(file: UploadFile, subfolder: str = "images") -> str:
    if USE_CLOUDINARY:
        result = cloudinary.uploader.upload(
            file.file,
            folder=f"architecture-journal/{subfolder}",
            resource_type="image",
        )
        return result["secure_url"]
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, subfolder, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/{subfolder}/{filename}"


# ── Writings ──

@app.get("/api/writings")
def list_writings(featured: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Writing).order_by(Writing.created_at.desc())
    if featured is not None:
        q = q.filter(Writing.featured == featured)
    return q.all()


@app.get("/api/writings/{writing_id}")
def get_writing(writing_id: int, db: Session = Depends(get_db)):
    w = db.query(Writing).filter(Writing.id == writing_id).first()
    if not w:
        raise HTTPException(404, "Writing not found")
    return w


@app.post("/api/writings")
async def create_writing(
    title: str = Form(...),
    subtitle: str = Form(None),
    summary: str = Form(...),
    content: str = Form(...),
    featured: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if is_valid_upload(cover_image):
        image_url = save_file(cover_image, "images")
    w = Writing(
        title=title, subtitle=subtitle, summary=summary,
        content=content, featured=featured, cover_image=image_url,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@app.put("/api/writings/{writing_id}")
async def update_writing(
    writing_id: int,
    title: str = Form(...),
    subtitle: str = Form(None),
    summary: str = Form(...),
    content: str = Form(...),
    featured: bool = Form(False),
    cover_image: Optional[UploadFile] = File(None),
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
        w.cover_image = save_file(cover_image, "images")
    db.commit()
    db.refresh(w)
    return w


@app.delete("/api/writings/{writing_id}")
def delete_writing(writing_id: int, db: Session = Depends(get_db)):
    w = db.query(Writing).filter(Writing.id == writing_id).first()
    if not w:
        raise HTTPException(404, "Writing not found")
    db.delete(w)
    db.commit()
    return {"ok": True}


# ── Fragments ──

@app.get("/api/fragments")
def list_fragments(db: Session = Depends(get_db)):
    return db.query(Fragment).order_by(Fragment.created_at.desc()).all()


@app.get("/api/fragments/{fragment_id}")
def get_fragment(fragment_id: int, db: Session = Depends(get_db)):
    f = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not f:
        raise HTTPException(404, "Fragment not found")
    return f


@app.post("/api/fragments")
async def create_fragment(
    text: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if is_valid_upload(image):
        image_url = save_file(image, "images")
    f = Fragment(text=text, image=image_url)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@app.delete("/api/fragments/{fragment_id}")
def delete_fragment(fragment_id: int, db: Session = Depends(get_db)):
    f = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not f:
        raise HTTPException(404, "Fragment not found")
    db.delete(f)
    db.commit()
    return {"ok": True}


# ── Visual Stories ──

@app.get("/api/visual-stories")
def list_visual_stories(db: Session = Depends(get_db)):
    stories = db.query(VisualStory).order_by(VisualStory.created_at.desc()).all()
    result = []
    for s in stories:
        result.append({
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
        })
    return result


@app.get("/api/visual-stories/{story_id}")
def get_visual_story(story_id: int, db: Session = Depends(get_db)):
    s = db.query(VisualStory).filter(VisualStory.id == story_id).first()
    if not s:
        raise HTTPException(404, "Visual story not found")
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


@app.post("/api/visual-stories")
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
            url = save_file(img_file, "visual_stories")
            caption = caps[i] if i < len(caps) else None
            story_img = VisualStoryImage(
                story_id=story.id, image_path=url, caption=caption, order=i
            )
            db.add(story_img)

    db.commit()
    db.refresh(story)
    return get_visual_story(story.id, db)


@app.delete("/api/visual-stories/{story_id}")
def delete_visual_story(story_id: int, db: Session = Depends(get_db)):
    s = db.query(VisualStory).filter(VisualStory.id == story_id).first()
    if not s:
        raise HTTPException(404, "Visual story not found")
    db.delete(s)
    db.commit()
    return {"ok": True}


# ── About ──

@app.get("/api/about")
def get_about(db: Session = Depends(get_db)):
    a = db.query(AboutContent).first()
    if not a:
        return {
            "id": None,
            "heading": "Architecture in Fragments",
            "body": "A spatial journal exploring the quiet moments of architecture and spatial experience.",
            "author_image": None,
        }
    return a


@app.put("/api/about")
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
        a.author_image = save_file(author_image, "images")
    db.commit()
    db.refresh(a)
    return a


# ── Site Settings ──

@app.get("/api/settings") # #genai
def get_settings(db: Session = Depends(get_db)):
    s = db.query(SiteSettings).first()
    if not s:
        return {"id": None, "hero_image": None}
    return s


@app.put("/api/settings/hero-image") # #genai
async def update_hero_image(
    hero_image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not is_valid_upload(hero_image):
        raise HTTPException(400, "No valid image provided")
    url = save_file(hero_image, "images")
    s = db.query(SiteSettings).first()
    if not s:
        s = SiteSettings(hero_image=url)
        db.add(s)
    else:
        s.hero_image = url
    db.commit()
    db.refresh(s)
    return s

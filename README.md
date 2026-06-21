# Architecture in Fragments — A Spatial Journal

A full-stack website for publishing architecture-related articles, fragments, and visual stories.

## Tech Stack

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Python + FastAPI (deployed on Render)
- **Database**: PostgreSQL via [Neon](https://neon.tech) (SQLite used locally by default)
- **Image Storage**: [Cloudinary](https://cloudinary.com) (local `/uploads` folder used as fallback)

## Color Palette

| Name            | HEX     |
|-----------------|---------|
| Raisin Black    | #2E211C |
| Cambridge Blue  | #9CBB87 |
| Pearl           | #EAE0C7 |
| Ruddy Brown     | #C06226 |
| Saddle Brown    | #984619 |

## Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your values
python -m uvicorn main:app --reload --port 8000
```

> **Python version**: 3.11.9 (matches Render deployment — see `render.yaml`)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string from Neon |
| `CLOUDINARY_CLOUD_NAME` | Yes (prod) | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes (prod) | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes (prod) | Cloudinary API secret |
| `FRONTEND_URL` | Yes (prod) | Vercel deployment URL (used for CORS) |
| `ADMIN_SECRET` | Yes (prod) | Secret verified server-side for all write requests |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (prod) | Render backend URL |
| `VITE_ADMIN_KEY` | Yes | Must match `ADMIN_SECRET` on the backend |

## Pages

- **Home** — Landing page with featured writings, fragments, and visual stories
- **Writings** — Essays and longer reflections on architecture
- **Fragments** — Short thoughts and architectural observations
- **Visual Stories** — Image-based architectural narratives
- **About** — Author introduction and site purpose
- **Admin** (`/admin/<VITE_ADMIN_KEY>`) — Content management interface

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/writings` | No | List writings (optional `?featured=true`) |
| POST | `/api/writings` | Yes | Create a writing |
| GET | `/api/writings/:id` | No | Get a writing |
| PUT | `/api/writings/:id` | Yes | Update a writing |
| DELETE | `/api/writings/:id` | Yes | Delete a writing |
| GET | `/api/fragments` | No | List fragments |
| POST | `/api/fragments` | Yes | Create a fragment |
| GET | `/api/fragments/:id` | No | Get a fragment |
| PUT | `/api/fragments/:id` | Yes | Update a fragment |
| DELETE | `/api/fragments/:id` | Yes | Delete a fragment |
| GET | `/api/visual-stories` | No | List visual stories |
| POST | `/api/visual-stories` | Yes | Create a visual story |
| GET | `/api/visual-stories/:id` | No | Get a visual story |
| PUT | `/api/visual-stories/:id` | Yes | Update a visual story's title/description |
| DELETE | `/api/visual-stories/:id` | Yes | Delete a visual story |
| GET | `/api/about` | No | Get about content |
| PUT | `/api/about` | Yes | Update about content |
| GET | `/api/settings` | No | Get site settings |
| PUT | `/api/settings/hero-image` | Yes | Update hero image |

> Auth = `X-Admin-Key` header with value matching `ADMIN_SECRET`.

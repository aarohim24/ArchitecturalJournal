# Architecture in Fragments — A Spatial Journal

A full-stack website for publishing architecture-related articles, fragments, and visual stories.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python + FastAPI
- **Database**: SQLite (via SQLAlchemy)

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
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## Pages

- **Home** — Landing page with featured writings, fragments, and visual stories
- **Writings** — Essays and longer reflections on architecture
- **Fragments** — Short thoughts and architectural observations
- **Visual Stories** — Image-based architectural narratives
- **About** — Author introduction and site purpose
- **Admin** (`/admin`) — Content management interface for uploading writings, fragments, and visual stories

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/writings` | List or create writings |
| GET/PUT/DELETE | `/api/writings/:id` | Read, update, or delete a writing |
| GET/POST | `/api/fragments` | List or create fragments |
| DELETE | `/api/fragments/:id` | Delete a fragment |
| GET/POST | `/api/visual-stories` | List or create visual stories |
| GET/DELETE | `/api/visual-stories/:id` | Read or delete a visual story |
| GET/PUT | `/api/about` | Read or update about content |
| POST | `/api/seed` | Seed database with sample data |

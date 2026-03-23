// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './VisualStories.css'

export default function VisualStories() {
  const [stories, setStories] = useState([])

  useEffect(() => {
    api.getVisualStories().then(setStories)
  }, [])

  return (
    <div className="vs-page">
      <header className="page-header">
        <h1>visual stories</h1>
        <p>architecture told through illustrations, diagrams, and image sequences</p>
      </header>

      <div className="vs-grid">
        {stories.map(s => (
          <Link to={`/visual-stories/${s.id}`} key={s.id} className="vs-card">
            <div className="vs-card-images">
              {s.images && s.images.length > 0 ? (
                <img src={api.imageUrl(s.images[0].image_path)} alt={s.title} />
              ) : (
                <div className="image-placeholder" />
              )}
            </div>
            <h3 className="vs-card-title">{s.title}</h3>
            <p className="vs-card-desc">{s.description}</p>
            <span className="vs-card-count">
              {s.images ? s.images.length : 0} image{s.images?.length !== 1 ? 's' : ''}
            </span>
          </Link>
        ))}
      </div>

      {stories.length === 0 && (
        <p className="empty-state">No visual stories yet. Check back soon.</p>
      )}
    </div>
  )
}

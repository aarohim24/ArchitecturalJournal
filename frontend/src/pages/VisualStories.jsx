// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './VisualStories.css'

function SkeletonCard() {
  return (
    <div className="vs-card skeleton-item" aria-hidden="true">
      <div className="vs-card-images skeleton-box" />
      <div className="skeleton-line sk-title" style={{ margin: '0.75rem 0 0.4rem' }} />
      <div className="skeleton-line sk-body" />
    </div>
  )
}

export default function VisualStories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVisualStories()
      .then(setStories)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="vs-page">
      <header className="page-header">
        <h1>visual stories</h1>
        <p>architecture told through illustrations, diagrams, and image sequences</p>
      </header>

      {loading ? (
        <div className="vs-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="vs-grid">
          {stories.map(s => (
            <Link
              to={`/visual-stories/${s.id}`}
              key={s.id}
              className="vs-card"
              onClick={() => window.gtag?.('event', 'visual_story_click', { story_id: s.id, story_title: s.title })}
            >
              <div className="vs-card-images">
                {s.images && s.images.length > 0 ? (
                  <img src={api.imageUrl(s.images[0].image_path)} alt={s.title} loading="lazy" />
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
      )}

      {!loading && stories.length === 0 && (
        <p className="empty-state">No visual stories yet. Check back soon.</p>
      )}
    </div>
  )
}

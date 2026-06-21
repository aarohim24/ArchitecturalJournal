// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './Writings.css'

function SkeletonCard() {
  return (
    <div className="writing-list-item skeleton-item" aria-hidden="true">
      <div className="writing-list-image skeleton-box" />
      <div className="writing-list-content">
        <div className="skeleton-line sk-title" />
        <div className="skeleton-line sk-subtitle" />
        <div className="skeleton-line sk-body" />
        <div className="skeleton-line sk-body sk-short" />
      </div>
    </div>
  )
}

export default function Writings() {
  const [writings, setWritings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWritings()
      .then(setWritings)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="writings-page">
      <header className="page-header">
        <h1>writings</h1>
        <p>essays and longer reflections exploring architecture, space, and cities</p>
      </header>

      {loading ? (
        <div className="writings-list">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="writings-list">
          {writings.map(w => (
            <Link
              to={`/writings/${w.id}`}
              key={w.id}
              className="writing-list-item"
              onClick={() => window.gtag?.('event', 'writing_click', { writing_id: w.id, writing_title: w.title })}
            >
              <div className="writing-list-image">
                {w.cover_image ? (
                  <img src={api.imageUrl(w.cover_image)} alt={w.title} loading="lazy" />
                ) : (
                  <div className="image-placeholder" />
                )}
              </div>
              <div className="writing-list-content">
                <h2>{w.title}</h2>
                {w.subtitle && <h3 className="writing-subtitle">{w.subtitle}</h3>}
                <p className="writing-summary">{w.summary}</p>
                <span className="read-more">read essay &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && writings.length === 0 && (
        <p className="empty-state">No writings yet. Check back soon.</p>
      )}
    </div>
  )
}

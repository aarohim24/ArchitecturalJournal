// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './Fragments.css'

function SkeletonCard() {
  return (
    <div className="fragment-list-item skeleton-item" aria-hidden="true">
      <div className="fragment-list-image skeleton-box" />
      <div className="fragment-list-content">
        <div className="skeleton-line sk-title" />
        <div className="skeleton-line sk-subtitle" />
        <div className="skeleton-line sk-body" />
        <div className="skeleton-line sk-body sk-short" />
      </div>
    </div>
  )
}

export default function Fragments() {
  const [fragments, setFragments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFragments()
      .then(setFragments)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fragments-page">
      <header className="page-header">
        <h1 className="fragments-page-title">fragments</h1>
        <p>short thoughts, notes, and small observations about spatial experiences</p>
      </header>

      {loading ? (
        <div className="fragments-list">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="fragments-list">
          {fragments.map(f => (
            <Link
              to={`/fragments/${f.id}`}
              key={f.id}
              className="fragment-list-item"
              onClick={() => window.gtag?.('event', 'fragment_click', { fragment_id: f.id })}
            >
              <div className="fragment-list-image">
                {f.cover_image ? (
                  <img src={api.imageUrl(f.cover_image)} alt={f.title || ''} loading="lazy" />
                ) : (
                  <div className="image-placeholder" />
                )}
              </div>
              <div className="fragment-list-content">
                {f.title && <h2>{f.title}</h2>}
                {f.subtitle && <h3 className="fragment-subtitle">{f.subtitle}</h3>}
                <blockquote className="fragment-item-text">{f.text}</blockquote>
                <span className="read-more">read fragment &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && fragments.length === 0 && (
        <p className="empty-state">No fragments yet. Check back soon.</p>
      )}
    </div>
  )
}

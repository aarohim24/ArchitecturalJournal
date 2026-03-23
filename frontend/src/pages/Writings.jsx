// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './Writings.css'

export default function Writings() {
  const [writings, setWritings] = useState([])

  useEffect(() => {
    api.getWritings().then(setWritings)
  }, [])

  return (
    <div className="writings-page">
      <header className="page-header">
        <h1>writings</h1>
        <p>essays and longer reflections exploring architecture, space, and cities</p>
      </header>

      <div className="writings-list">
        {writings.map(w => (
          <Link to={`/writings/${w.id}`} key={w.id} className="writing-list-item">
            <div className="writing-list-image">
              {w.cover_image ? (
                <img src={api.imageUrl(w.cover_image)} alt={w.title} />
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

      {writings.length === 0 && (
        <p className="empty-state">No writings yet. Check back soon.</p>
      )}
    </div>
  )
}

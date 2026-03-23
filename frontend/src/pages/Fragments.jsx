// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import './Fragments.css'

export default function Fragments() {
  const [fragments, setFragments] = useState([])

  useEffect(() => {
    api.getFragments().then(setFragments)
  }, [])

  return (
    <div className="fragments-page">
      <header className="page-header">
        <h1 className="fragments-page-title">fragments</h1>
        <p>short thoughts, notes, and small observations about spatial experiences</p>
      </header>

      <div className="fragments-masonry">
        {fragments.map(f => (
          <Link to={`/fragments/${f.id}`} key={f.id} className="fragment-item">
            {f.image && (
              <div className="fragment-item-image">
                <img src={api.imageUrl(f.image)} alt="" />
              </div>
            )}
            <blockquote className="fragment-item-text">
              {f.text}
            </blockquote>
          </Link>
        ))}
      </div>

      {fragments.length === 0 && (
        <p className="empty-state">No fragments yet. Check back soon.</p>
      )}
    </div>
  )
}

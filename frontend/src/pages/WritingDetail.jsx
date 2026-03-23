// #genai
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import './WritingDetail.css'

export default function WritingDetail() {
  const { id } = useParams()
  const [writing, setWriting] = useState(null)

  useEffect(() => {
    api.getWriting(id).then(setWriting)
  }, [id])

  if (!writing) {
    return <div className="loading">Loading...</div>
  }

  return (
    <article className="writing-detail">
      <Link to="/writings" className="back-link">&larr; back to writings</Link>

      {writing.cover_image && (
        <div className="detail-cover">
          <img src={api.imageUrl(writing.cover_image)} alt={writing.title} />
        </div>
      )}

      <header className="detail-header">
        <h1>{writing.title}</h1>
        {writing.subtitle && <h2 className="detail-subtitle">{writing.subtitle}</h2>}
        <p className="detail-summary">{writing.summary}</p>
      </header>

      <div className="detail-body">
        {writing.content.split('\n').map((para, i) =>
          para.trim() ? <p key={i}>{para}</p> : null
        )}
      </div>
    </article>
  )
}

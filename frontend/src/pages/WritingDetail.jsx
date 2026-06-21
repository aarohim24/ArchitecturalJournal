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

      {/* Cover photo — 4:3 */}
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

      {/* Supporting photos */}
      {writing.supporting_images?.length > 0 && (
        <div className="supporting-photos">
          <h3 className="supporting-photos-heading">photographs</h3>
          <div className="supporting-photos-grid">
            {writing.supporting_images.map(img => (
              <figure key={img.id} className="supporting-photo">
                <div className="supporting-photo-frame">
                  <img src={api.imageUrl(img.image_path)} alt={img.caption || ''} loading="lazy" />
                </div>
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

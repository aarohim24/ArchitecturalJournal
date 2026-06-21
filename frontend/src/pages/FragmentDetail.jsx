// #genai
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import './FragmentDetail.css'

export default function FragmentDetail() {
  const { id } = useParams()
  const [fragment, setFragment] = useState(null)

  useEffect(() => {
    api.getFragment(id).then(setFragment)
  }, [id])

  if (!fragment) return <div className="loading">Loading...</div>

  return (
    <article className="fragment-detail">
      <Link to="/fragments" className="back-link">&larr; back to fragments</Link>

      {/* Cover photo — 4:3 */}
      {fragment.cover_image && (
        <div className="detail-cover">
          <img src={api.imageUrl(fragment.cover_image)} alt={fragment.title || ''} />
        </div>
      )}

      <header className="detail-header">
        {fragment.title && <h1>{fragment.title}</h1>}
        {fragment.subtitle && <h2 className="detail-subtitle">{fragment.subtitle}</h2>}
        <blockquote className="fd-text">{fragment.text}</blockquote>
      </header>

      {/* Supporting photos */}
      {fragment.supporting_images?.length > 0 && (
        <div className="supporting-photos">
          {fragment.supporting_images.map(img => (
            <figure key={img.id} className="supporting-photo">
              <div className="supporting-photo-frame">
                <img src={api.imageUrl(img.image_path)} alt={img.caption || ''} loading="lazy" />
              </div>
              {img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </article>
  )
}

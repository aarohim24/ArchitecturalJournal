// #genai
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import './VisualStoryDetail.css'

export default function VisualStoryDetail() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    api.getVisualStory(id).then(setStory)
  }, [id])

  if (!story) return <div className="loading">Loading...</div>

  const images = story.images || []

  return (
    <div className="vsd-page">
      <Link to="/visual-stories" className="back-link">&larr; back to visual stories</Link>

      <header className="vsd-header">
        <h1>{story.title}</h1>
        {story.description && <p>{story.description}</p>}
      </header>

      {images.length > 0 && (
        <div className="vsd-gallery">
          <div className="vsd-main-image">
            <img src={api.imageUrl(images[activeIndex].image_path)} alt="" />
            {images[activeIndex].caption && (
              <p className="vsd-caption">{images[activeIndex].caption}</p>
            )}
          </div>

          {images.length > 1 && (
            <div className="vsd-thumbnails">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`vsd-thumb ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <img src={api.imageUrl(img.image_path)} alt="" />
                </button>
              ))}
            </div>
          )}

          <div className="vsd-nav">
            <button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex(i => i - 1)}
            >
              &larr; previous
            </button>
            <span>{activeIndex + 1} / {images.length}</span>
            <button
              disabled={activeIndex === images.length - 1}
              onClick={() => setActiveIndex(i => i + 1)}
            >
              next &rarr;
            </button>
          </div>
        </div>
      )}

      {images.length === 0 && (
        <p className="empty-state">No images in this story yet.</p>
      )}
    </div>
  )
}

// #genai
import { useState, useEffect } from 'react'
import { api } from '../api'
import './About.css'

export default function About() {
  const [about, setAbout] = useState(null)

  useEffect(() => {
    api.getAbout().then(setAbout)
  }, [])

  if (!about) return <div className="loading">Loading...</div>

  return (
    <div className="about-page">
      <div className="about-layout">
        <div className="about-content">
          <h1>{about.heading}</h1>
          <div className="about-body">
            {about.body.split('\n').map((para, i) =>
              para.trim() ? <p key={i}>{para}</p> : null
            )}
          </div>
        </div>

        {about.author_image && (
          <div className="about-image">
            <img src={api.imageUrl(about.author_image)} alt="Author" />
          </div>
        )}
      </div>

    </div>
  )
}

// #genai
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import heroImg from '../assets/hero.png'
import './Home.css'

export default function Home() {
  const [writings, setWritings] = useState([])
  const [fragments, setFragments] = useState([])
  const [stories, setStories] = useState([])
  const [heroSrc, setHeroSrc] = useState(heroImg) // #genai

  useEffect(() => {
    api.getWritings(true).then(setWritings)
    api.getFragments().then(setFragments)
    api.getVisualStories().then(setStories)
    api.getSettings().then(s => { // #genai
      if (s.hero_image) setHeroSrc(api.imageUrl(s.hero_image))
    })
  }, [])

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="hero-wrapper">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              architecture<br />in fragments
            </h1>
            <p className="hero-description">
              we never stand outside a place and understand it,<br />
              we move through it, piece by piece,<br />
              forming it as we go.
            </p>
            <p className="hero-handwritten">
              have you looked slowly enough<br />
              to see its full story?
            </p>
          </div>
          <div className="hero-image">
            <img src={heroSrc} alt="Architecture in Fragments" />
          </div>
        </section>
      </div>

      {/* Featured Writings */}
      <section className="section featured-writings">
        <div className="section-header">
          <h2 className="section-title">featured writings</h2>
          <span className="section-subtitle">thoughts on architecture as it is lived and perceived</span>
        </div>
        {writings.length > 0 ? (
          <div className="writings-grid">
            {writings.slice(0, 3).map(w => (
              <Link to={`/writings/${w.id}`} key={w.id} className="writing-card">
                <div className="writing-card-image">
                  {w.cover_image ? (
                    <img src={api.imageUrl(w.cover_image)} alt={w.title} />
                  ) : (
                    <div className="image-placeholder" />
                  )}
                </div>
                <h3 className="writing-card-title">{w.title}</h3>
                <p className="writing-card-summary">{w.summary}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-hint">no featured writings yet — check back soon.</p>
        )}
        <div className="section-footer">
          <Link to="/writings" className="view-all-link">view all writings &rarr;</Link>
        </div>
      </section>

      {/* Fragments */}
      <section className="section fragments-section">
        <div className="section-header">
          <h2 className="section-title fragment-title">fragments</h2>
          <span className="section-subtitle">moments of noticing, written down before they pass</span>
        </div>
        {fragments.length > 0 ? (
          <div className="fragments-grid">
            {fragments.slice(0, 3).map(f => (
              <Link to={`/fragments/${f.id}`} key={f.id} className="fragment-card">
                {f.image && (
                  <div className="fragment-image">
                    <img src={api.imageUrl(f.image)} alt="" />
                  </div>
                )}
                <p className="fragment-text">{f.text}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-hint">no fragments yet — check back soon.</p>
        )}
        <div className="section-footer">
          <Link to="/fragments" className="view-all-link">view all fragments &rarr;</Link>
        </div>
      </section>

      {/* Visual Stories */}
      <section className="section visual-stories-section">
        <div className="section-header">
          <h2 className="section-title vs-title">visual stories</h2>
          <span className="section-subtitle">architecture observed through visual composition</span>
        </div>
        {stories.length > 0 ? (
          <div className="stories-preview">
            {stories.slice(0, 2).map(s => (
              <Link to={`/visual-stories/${s.id}`} key={s.id} className="story-preview-card">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-hint">no visual stories yet — check back soon.</p>
        )}
        <div className="section-footer">
          <Link to="/visual-stories" className="view-all-link">
            explore visual stories &harr;
          </Link>
        </div>
      </section>
    </div>
  )
}

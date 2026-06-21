import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import heroImg from '../assets/hero.png'
import './Home.css'

/** Safe wrapper around GA events — no-ops when gtag is unavailable. */
function trackEvent(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

function WritingCardSkeleton() {
  return (
    <div className="writing-card skeleton-item" aria-hidden="true">
      <div className="writing-card-image skeleton-box" />
      <div className="skeleton-line sk-title" />
      <div className="skeleton-line sk-body" />
      <div className="skeleton-line sk-body sk-short" />
    </div>
  )
}

function FragmentCardSkeleton() {
  return (
    <div className="fragment-card skeleton-item" aria-hidden="true">
      <div className="fragment-image skeleton-box" />
      <div className="skeleton-line sk-body" />
      <div className="skeleton-line sk-body sk-short" />
    </div>
  )
}

function StoryCardSkeleton() {
  return (
    <div className="story-preview-card skeleton-item" aria-hidden="true">
      <div className="story-card-image skeleton-box" />
      <div style={{ padding: '1.25rem 1.5rem 1rem' }}>
        <div className="skeleton-line sk-title" />
        <div className="skeleton-line sk-body" />
      </div>
    </div>
  )
}

function useSlider() {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [update])

  const scroll = (dir) => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector(':scope > *')
    const amount = card ? card.offsetWidth + 32 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return { ref, canLeft, canRight, scrollLeft: () => scroll(-1), scrollRight: () => scroll(1), update }
}

function Slider({ children, className = '' }) {
  const { ref, canLeft, canRight, scrollLeft, scrollRight } = useSlider()
  return (
    <div className={`slider-wrapper ${className}`}>
      {canLeft && (
        <button className="slider-arrow slider-arrow-left" onClick={scrollLeft} aria-label="Scroll left">
          ‹
        </button>
      )}
      <div className="slider-track" ref={ref}>
        {children}
      </div>
      {canRight && (
        <button className="slider-arrow slider-arrow-right" onClick={scrollRight} aria-label="Scroll right">
          ›
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const [writings, setWritings] = useState([])
  const [fragments, setFragments] = useState([])
  const [stories, setStories] = useState([])
  const [heroSrc, setHeroSrc] = useState(heroImg)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.getWritings(true).then(setWritings),
      api.getFragments().then(setFragments),
      api.getVisualStories().then(setStories),
      api.getSettings().then(s => { if (s.hero_image) setHeroSrc(api.imageUrl(s.hero_image)) }),
    ]).finally(() => setLoading(false))
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
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">featured writings</h2>
            <span className="section-subtitle">thoughts on architecture as it is lived and perceived</span>
          </div>
          {loading ? (
            <Slider className="writings-slider">
              {[1, 2, 3].map(i => <WritingCardSkeleton key={i} />)}
            </Slider>
          ) : writings.length > 0 ? (
            <Slider className="writings-slider">
              {writings.map(w => (
                <Link
                  to={`/writings/${w.id}`}
                  key={w.id}
                  className="writing-card"
                  onClick={() => trackEvent('writing_click', { writing_id: w.id, writing_title: w.title })}
                >
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
            </Slider>
          ) : (
            <p className="empty-hint">no featured writings yet — check back soon.</p>
          )}
          <div className="section-footer">
            <Link to="/writings" className="view-all-link">view all writings &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Fragments */}
      <section className="section fragments-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title fragment-title">fragments</h2>
            <span className="section-subtitle">moments of noticing, written down before they pass</span>
          </div>
          {loading ? (
            <Slider className="fragments-slider">
              {[1, 2, 3].map(i => <FragmentCardSkeleton key={i} />)}
            </Slider>
          ) : fragments.length > 0 ? (
            <Slider className="fragments-slider">
              {fragments.map(f => (
                <Link
                  to={`/fragments/${f.id}`}
                  key={f.id}
                  className="fragment-card"
                  onClick={() => trackEvent('fragment_click', { fragment_id: f.id })}
                >
                  {f.cover_image && (
                    <div className="fragment-image">
                      <img src={api.imageUrl(f.cover_image)} alt="" loading="lazy" />
                    </div>
                  )}
                  {f.title && <p className="fragment-card-title">{f.title}</p>}
                  <p className="fragment-text">{f.text}</p>
                </Link>
              ))}
            </Slider>
          ) : (
            <p className="empty-hint">no fragments yet — check back soon.</p>
          )}
          <div className="section-footer">
            <Link to="/fragments" className="view-all-link">view all fragments &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Visual Stories */}
      <section className="section visual-stories-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title vs-title">visual stories</h2>
            <span className="section-subtitle">architecture observed through visual composition</span>
          </div>
          {loading ? (
            <Slider className="stories-slider">
              {[1, 2].map(i => <StoryCardSkeleton key={i} />)}
            </Slider>
          ) : stories.length > 0 ? (
            <Slider className="stories-slider">
              {stories.map(s => (
                <Link
                  to={`/visual-stories/${s.id}`}
                  key={s.id}
                  className="story-preview-card"
                  onClick={() => trackEvent('visual_story_click', { story_id: s.id, story_title: s.title })}
                >
                  {s.images && s.images.length > 0 && (
                    <div className="story-card-image">
                      <img src={api.imageUrl(s.images[0].image_path)} alt={s.title} />
                    </div>
                  )}
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  {s.images && <span className="story-card-count">{s.images.length} image{s.images.length !== 1 ? 's' : ''}</span>}
                </Link>
              ))}
            </Slider>
          ) : (
            <p className="empty-hint">no visual stories yet — check back soon.</p>
          )}
          <div className="section-footer">
            <Link to="/visual-stories" className="view-all-link">
              explore visual stories &harr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

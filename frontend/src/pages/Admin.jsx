// #genai
import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import './Admin.css'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('writings')
  const [writings, setWritings] = useState([])
  const [fragments, setFragments] = useState([])
  const [stories, setStories] = useState([])
  const [message, setMessage] = useState('')
  const [formKey, setFormKey] = useState(0)
  const formTopRef = useRef(null)

  const refresh = () => {
    api.getWritings().then(setWritings)
    api.getFragments().then(setFragments)
    api.getVisualStories().then(setStories)
  }

  useEffect(() => { refresh() }, [])

  const flash = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const resetForm = () => {
    setFormKey(k => k + 1)
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleWritingSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    if (!fd.get('featured')) fd.set('featured', 'false')
    const fileField = fd.get('cover_image')
    if (fileField && fileField.size === 0) fd.delete('cover_image')
    await api.createWriting(fd)
    flash('Writing created! You can add another below.')
    resetForm()
    refresh()
  }

  const handleFragmentSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const fileField = fd.get('image')
    if (fileField && fileField.size === 0) fd.delete('image')
    await api.createFragment(fd)
    flash('Fragment created! You can add another below.')
    resetForm()
    refresh()
  }

  const handleStorySubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    await api.createVisualStory(fd)
    flash('Visual story created! You can add another below.')
    resetForm()
    refresh()
  }

  const handleHeroSubmit = async (e) => { // #genai
    e.preventDefault()
    const fd = new FormData(e.target)
    const fileField = fd.get('hero_image')
    if (!fileField || fileField.size === 0) { flash('Please select an image'); return }
    await api.updateHeroImage(fd)
    flash('Hero image updated!')
    resetForm()
  }

  const handleAboutSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const fileField = fd.get('author_image')
    if (fileField && fileField.size === 0) fd.delete('author_image')
    await api.updateAbout(fd)
    flash('About page updated!')
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>contribute</h1>
        <p>share your writings, fragments, and visual stories about architecture</p>
      </header>

      {message && <div className="admin-flash">{message}</div>}

      <div className="admin-tabs" ref={formTopRef}>
        {['writings', 'fragments', 'visual stories', 'about', 'settings'].map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Writings Tab ── */}
      {activeTab === 'writings' && (
        <div className="admin-section">
          <h2>New Writing</h2>
          <form key={`writing-${formKey}`} onSubmit={handleWritingSubmit} className="admin-form">
            <input name="title" placeholder="Title" required />
            <input name="subtitle" placeholder="Subtitle (optional)" />
            <textarea name="summary" placeholder="Summary" required rows={2} />
            <textarea name="content" placeholder="Full essay content..." required rows={10} />
            <label className="admin-checkbox">
              <input type="checkbox" name="featured" value="true" />
              <span>Featured on homepage</span>
            </label>
            <label className="admin-file">
              <span>Cover Image</span>
              <input type="file" name="cover_image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit">Publish Writing</button>
          </form>

          <h2>Existing Writings ({writings.length})</h2>
          {writings.length === 0 ? (
            <p className="admin-empty">No writings yet. Use the form above to add your first.</p>
          ) : (
            <ul className="admin-list">
              {writings.map(w => (
                <li key={w.id}>
                  <span>{w.title} {w.featured && <em className="featured-badge">featured</em>}</span>
                  <button onClick={async () => {
                    await api.deleteWriting(w.id)
                    flash('Deleted')
                    refresh()
                  }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Fragments Tab ── */}
      {activeTab === 'fragments' && (
        <div className="admin-section">
          <h2>New Fragment</h2>
          <form key={`fragment-${formKey}`} onSubmit={handleFragmentSubmit} className="admin-form">
            <textarea name="text" placeholder="A short architectural observation..." required rows={4} />
            <label className="admin-file">
              <span>Image (optional)</span>
              <input type="file" name="image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit">Add Fragment</button>
          </form>

          <h2>Existing Fragments ({fragments.length})</h2>
          {fragments.length === 0 ? (
            <p className="admin-empty">No fragments yet. Use the form above to add your first.</p>
          ) : (
            <ul className="admin-list">
              {fragments.map(f => (
                <li key={f.id}>
                  <span>{f.text.substring(0, 60)}...</span>
                  <button onClick={async () => {
                    await api.deleteFragment(f.id)
                    flash('Deleted')
                    refresh()
                  }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Visual Stories Tab ── */}
      {activeTab === 'visual stories' && (
        <div className="admin-section">
          <h2>New Visual Story</h2>
          <form key={`story-${formKey}`} onSubmit={handleStorySubmit} className="admin-form">
            <input name="title" placeholder="Story title" required />
            <textarea name="description" placeholder="Brief description..." rows={3} />
            <label className="admin-file">
              <span>Images (select multiple)</span>
              <input type="file" name="images" accept="image/*" multiple />
            </label>
            <button type="submit" className="admin-submit">Create Story</button>
          </form>

          <h2>Existing Visual Stories ({stories.length})</h2>
          {stories.length === 0 ? (
            <p className="admin-empty">No visual stories yet. Use the form above to add your first.</p>
          ) : (
            <ul className="admin-list">
              {stories.map(s => (
                <li key={s.id}>
                  <span>{s.title}</span>
                  <button onClick={async () => {
                    await api.deleteVisualStory(s.id)
                    flash('Deleted')
                    refresh()
                  }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── About Tab ── */}
      {activeTab === 'about' && (
        <div className="admin-section">
          <h2>Update About Page</h2>
          <form key={`about-${formKey}`} onSubmit={handleAboutSubmit} className="admin-form">
            <input name="heading" placeholder="Heading" defaultValue="Architecture in Fragments" required />
            <textarea name="body" placeholder="About body text..." required rows={8} />
            <label className="admin-file">
              <span>Author Image</span>
              <input type="file" name="author_image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit">Update About</button>
          </form>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 'settings' && (
        <div className="admin-section">
          <h2>Hero Image</h2>
          <p className="admin-hint">This image appears on the homepage hero section.</p>
          <form key={`hero-${formKey}`} onSubmit={handleHeroSubmit} className="admin-form">
            <label className="admin-file">
              <span>Upload New Hero Image</span>
              <input type="file" name="hero_image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit">Update Hero Image</button>
          </form>
        </div>
      )}
    </div>
  )
}

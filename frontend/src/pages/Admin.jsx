import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import './Admin.css'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('writings')
  const [writings, setWritings]   = useState([])
  const [fragments, setFragments] = useState([])
  const [stories, setStories]     = useState([])

  const [message, setMessage]       = useState('')
  const [messageType, setMessageType] = useState('success')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  // which item is currently being edited (null = creating new)
  const [editingWriting,  setEditingWriting]  = useState(null)
  const [editingFragment, setEditingFragment] = useState(null)
  const [editingStory,    setEditingStory]    = useState(null)

  // file-input mirrors for UI hints
  const [storyImageFiles,    setStoryImageFiles]    = useState([])
  const [writingSupportFiles, setWritingSupportFiles] = useState([])
  const [fragmentSupportFiles, setFragmentSupportFiles] = useState([])

  const formTopRef = useRef(null)

  // ── data ──────────────────────────────────────────────────────────────────

  const refresh = () => {
    api.getWritings().then(setWritings).catch(() => {})
    api.getFragments().then(setFragments).catch(() => {})
    api.getVisualStories().then(setStories).catch(() => {})
  }

  useEffect(() => { refresh() }, [])

  // ── helpers ───────────────────────────────────────────────────────────────

  const flash = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const resetForm = () => {
    setFormKey(k => k + 1)
    setStoryImageFiles([])
    setWritingSupportFiles([])
    setFragmentSupportFiles([])
    setEditingWriting(null)
    setEditingFragment(null)
    setEditingStory(null)
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const startEdit = (item, type) => {
    setEditingWriting(null)
    setEditingFragment(null)
    setEditingStory(null)
    if (type === 'writing')  { setActiveTab('writings');       setEditingWriting(item)  }
    if (type === 'fragment') { setActiveTab('fragments');      setEditingFragment(item) }
    if (type === 'story')    { setActiveTab('visual stories'); setEditingStory(item)    }
    setFormKey(k => k + 1)
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // ── submit handlers ───────────────────────────────────────────────────────

  const handleWritingSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target)
    if (!fd.get('featured')) fd.set('featured', 'false')
    const cover = fd.get('cover_image')
    if (cover && cover.size === 0) fd.delete('cover_image')
    const supporting = fd.getAll('supporting_images')
    fd.delete('supporting_images')
    supporting.forEach(f => { if (f.size > 0) fd.append('supporting_images', f) })
    try {
      if (editingWriting) {
        await api.updateWriting(editingWriting.id, fd)
        flash('Writing updated!')
      } else {
        await api.createWriting(fd)
        flash('Writing created!')
      }
      resetForm()
      refresh()
    } catch (err) {
      flash(err.message || 'Failed to save writing.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFragmentSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target)
    const cover = fd.get('cover_image')
    if (cover && cover.size === 0) fd.delete('cover_image')
    const supporting = fd.getAll('supporting_images')
    fd.delete('supporting_images')
    supporting.forEach(f => { if (f.size > 0) fd.append('supporting_images', f) })
    try {
      if (editingFragment) {
        await api.updateFragment(editingFragment.id, fd)
        flash('Fragment updated!')
      } else {
        await api.createFragment(fd)
        flash('Fragment created!')
      }
      resetForm()
      refresh()
    } catch (err) {
      flash(err.message || 'Failed to save fragment.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStorySubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target)
    storyImageFiles.forEach((_, i) => {
      const captionInput = e.target.querySelector(`[name="caption_${i}"]`)
      if (captionInput) fd.append('captions', captionInput.value || '')
    })
    try {
      if (editingStory) {
        await api.updateVisualStory(editingStory.id, fd)
        flash('Visual story updated!')
      } else {
        await api.createVisualStory(fd)
        flash('Visual story created!')
      }
      resetForm()
      refresh()
    } catch (err) {
      flash(err.message || 'Failed to save visual story.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHeroSubmit = async (e) => {
    e.preventDefault()
    const fileField = new FormData(e.target).get('hero_image')
    if (!fileField || fileField.size === 0) { flash('Please select an image.', 'error'); return }
    setIsSubmitting(true)
    try {
      await api.updateHeroImage(new FormData(e.target))
      flash('Hero image updated!')
      resetForm()
    } catch (err) {
      flash(err.message || 'Failed to update hero image.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAboutSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target)
    const cover = fd.get('author_image')
    if (cover && cover.size === 0) fd.delete('author_image')
    try {
      await api.updateAbout(fd)
      flash('About page updated!')
      resetForm()
    } catch (err) {
      flash(err.message || 'Failed to update about page.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── delete helpers ────────────────────────────────────────────────────────

  const deleteItem = async (apiFn, id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return
    try {
      await apiFn(id)
      flash('Deleted.')
      refresh()
    } catch (err) {
      flash(err.message || 'Failed to delete.', 'error')
    }
  }

  // ── aliases for the form ──────────────────────────────────────────────────
  const ew = editingWriting
  const ef = editingFragment
  const es = editingStory

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>contribute</h1>
        <p>share your writings, fragments, and visual stories about architecture</p>
      </header>

      {message && (
        <div className={`admin-flash${messageType === 'error' ? ' admin-flash-error' : ''}`}>
          {message}
        </div>
      )}

      <div className="admin-tabs" ref={formTopRef}>
        {['writings', 'fragments', 'visual stories', 'about', 'settings'].map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); resetForm() }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Writings ─────────────────────────────────────────────────────── */}
      {activeTab === 'writings' && (
        <div className="admin-section">
          <div className="admin-form-header">
            <h2>{ew ? 'Edit Writing' : 'New Writing'}</h2>
            {ew && <button className="admin-cancel" onClick={resetForm}>✕ Cancel edit</button>}
          </div>

          <form key={`writing-${formKey}`} onSubmit={handleWritingSubmit} className="admin-form">
            <input name="title"    placeholder="Title"    required defaultValue={ew?.title    ?? ''} />
            <input name="subtitle" placeholder="Subtitle (optional)" defaultValue={ew?.subtitle ?? ''} />
            <textarea name="summary" placeholder="Summary" required rows={2}  defaultValue={ew?.summary ?? ''} />
            <textarea name="content" placeholder="Full essay content…" required rows={10} defaultValue={ew?.content ?? ''} />

            <label className="admin-checkbox">
              <input type="checkbox" name="featured" value="true" defaultChecked={!!ew?.featured} />
              <span>Featured on homepage</span>
            </label>

            <label className="admin-file">
              <span>Cover Photo{ew ? ' — leave blank to keep existing' : ''}</span>
              <input type="file" name="cover_image" accept="image/*" />
            </label>
            {ew?.cover_image && (
              <p className="admin-hint">
                Current cover: <a href={api.imageUrl(ew.cover_image)} target="_blank" rel="noreferrer">view ↗</a>
              </p>
            )}

            <label className="admin-file">
              <span>Supporting Photos (multiple)</span>
              <input type="file" name="supporting_images" accept="image/*" multiple
                onChange={e => setWritingSupportFiles(Array.from(e.target.files))} />
            </label>
            {writingSupportFiles.length > 0 && (
              <p className="admin-hint">{writingSupportFiles.length} file{writingSupportFiles.length !== 1 ? 's' : ''} selected</p>
            )}

            <button type="submit" className="admin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : ew ? 'Update Writing' : 'Publish Writing'}
            </button>
          </form>

          <h2>Existing Writings ({writings.length})</h2>
          {writings.length === 0
            ? <p className="admin-empty">No writings yet.</p>
            : (
              <ul className="admin-list">
                {writings.map(w => (
                  <li key={w.id}>
                    <span>{w.title}{w.featured && <em className="featured-badge">featured</em>}</span>
                    <div className="admin-item-actions">
                      <button className="admin-edit-btn" onClick={() => startEdit(w, 'writing')}>Edit</button>
                      <button className="admin-delete-btn" onClick={() => deleteItem(api.deleteWriting.bind(api), w.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      )}

      {/* ── Fragments ────────────────────────────────────────────────────── */}
      {activeTab === 'fragments' && (
        <div className="admin-section">
          <div className="admin-form-header">
            <h2>{ef ? 'Edit Fragment' : 'New Fragment'}</h2>
            {ef && <button className="admin-cancel" onClick={resetForm}>✕ Cancel edit</button>}
          </div>

          <form key={`fragment-${formKey}`} onSubmit={handleFragmentSubmit} className="admin-form">
            <input name="title"    placeholder="Title (optional)"    defaultValue={ef?.title    ?? ''} />
            <input name="subtitle" placeholder="Subtitle (optional)" defaultValue={ef?.subtitle ?? ''} />
            <textarea name="text" placeholder="A short architectural observation…" required rows={4} defaultValue={ef?.text ?? ''} />

            <label className="admin-file">
              <span>Cover Photo{ef ? ' — leave blank to keep existing' : ' (optional)'}</span>
              <input type="file" name="cover_image" accept="image/*" />
            </label>
            {ef?.cover_image && (
              <p className="admin-hint">
                Current cover: <a href={api.imageUrl(ef.cover_image)} target="_blank" rel="noreferrer">view ↗</a>
              </p>
            )}

            <label className="admin-file">
              <span>Supporting Photos (multiple, optional)</span>
              <input type="file" name="supporting_images" accept="image/*" multiple
                onChange={e => setFragmentSupportFiles(Array.from(e.target.files))} />
            </label>
            {fragmentSupportFiles.length > 0 && (
              <p className="admin-hint">{fragmentSupportFiles.length} file{fragmentSupportFiles.length !== 1 ? 's' : ''} selected</p>
            )}

            <button type="submit" className="admin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : ef ? 'Update Fragment' : 'Add Fragment'}
            </button>
          </form>

          <h2>Existing Fragments ({fragments.length})</h2>
          {fragments.length === 0
            ? <p className="admin-empty">No fragments yet.</p>
            : (
              <ul className="admin-list">
                {fragments.map(f => (
                  <li key={f.id}>
                    <span>{f.title || f.text.substring(0, 60)}…</span>
                    <div className="admin-item-actions">
                      <button className="admin-edit-btn" onClick={() => startEdit(f, 'fragment')}>Edit</button>
                      <button className="admin-delete-btn" onClick={() => deleteItem(api.deleteFragment.bind(api), f.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      )}

      {/* ── Visual Stories ────────────────────────────────────────────────── */}
      {activeTab === 'visual stories' && (
        <div className="admin-section">
          <div className="admin-form-header">
            <h2>{es ? 'Edit Visual Story' : 'New Visual Story'}</h2>
            {es && <button className="admin-cancel" onClick={resetForm}>✕ Cancel edit</button>}
          </div>

          <form key={`story-${formKey}`} onSubmit={handleStorySubmit} className="admin-form">
            <input name="title" placeholder="Story title" required defaultValue={es?.title ?? ''} />
            <textarea name="description" placeholder="Brief description…" rows={3} defaultValue={es?.description ?? ''} />

            {!es && (
              <>
                <label className="admin-file">
                  <span>Images (select multiple)</span>
                  <input type="file" name="images" accept="image/*" multiple
                    onChange={e => setStoryImageFiles(Array.from(e.target.files))} />
                </label>
                {storyImageFiles.length > 0 && (
                  <div className="admin-captions">
                    <p className="admin-hint">Optional caption per image:</p>
                    {storyImageFiles.map((file, i) => (
                      <label key={i} className="admin-caption-row">
                        <span className="admin-caption-filename">{file.name}</span>
                        <input name={`caption_${i}`} placeholder={`Caption for image ${i + 1} (optional)`} />
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
            {es && (
              <p className="admin-hint">
                Images cannot be changed here. To replace images, delete this story and create a new one.
              </p>
            )}

            <button type="submit" className="admin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : es ? 'Update Story' : 'Create Story'}
            </button>
          </form>

          <h2>Existing Visual Stories ({stories.length})</h2>
          {stories.length === 0
            ? <p className="admin-empty">No visual stories yet.</p>
            : (
              <ul className="admin-list">
                {stories.map(s => (
                  <li key={s.id}>
                    <span>{s.title}</span>
                    <div className="admin-item-actions">
                      <button className="admin-edit-btn" onClick={() => startEdit(s, 'story')}>Edit</button>
                      <button className="admin-delete-btn" onClick={() => deleteItem(api.deleteVisualStory.bind(api), s.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      )}

      {/* ── About ─────────────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="admin-section">
          <h2>Update About Page</h2>
          <form key={`about-${formKey}`} onSubmit={handleAboutSubmit} className="admin-form">
            <input name="heading" placeholder="Heading" defaultValue="Architecture in Fragments" required />
            <textarea name="body" placeholder="About body text…" required rows={8} />
            <label className="admin-file">
              <span>Author Image</span>
              <input type="file" name="author_image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Update About'}
            </button>
          </form>
        </div>
      )}

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="admin-section">
          <h2>Hero Image</h2>
          <p className="admin-hint">This image appears on the homepage hero section.</p>
          <form key={`hero-${formKey}`} onSubmit={handleHeroSubmit} className="admin-form">
            <label className="admin-file">
              <span>Upload New Hero Image</span>
              <input type="file" name="hero_image" accept="image/*" />
            </label>
            <button type="submit" className="admin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading…' : 'Update Hero Image'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

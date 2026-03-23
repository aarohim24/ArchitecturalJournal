// #genai
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  async getWritings(featured) {
    const params = featured !== undefined ? `?featured=${featured}` : ''
    const res = await fetch(`${API_BASE}/api/writings${params}`)
    return res.json()
  },

  async getWriting(id) {
    const res = await fetch(`${API_BASE}/api/writings/${id}`)
    return res.json()
  },

  async createWriting(formData) {
    const res = await fetch(`${API_BASE}/api/writings`, {
      method: 'POST',
      body: formData,
    })
    return res.json()
  },

  async deleteWriting(id) {
    const res = await fetch(`${API_BASE}/api/writings/${id}`, { method: 'DELETE' })
    return res.json()
  },

  async getFragments() {
    const res = await fetch(`${API_BASE}/api/fragments`)
    return res.json()
  },

  async getFragment(id) {
    const res = await fetch(`${API_BASE}/api/fragments/${id}`)
    return res.json()
  },

  async createFragment(formData) {
    const res = await fetch(`${API_BASE}/api/fragments`, {
      method: 'POST',
      body: formData,
    })
    return res.json()
  },

  async deleteFragment(id) {
    const res = await fetch(`${API_BASE}/api/fragments/${id}`, { method: 'DELETE' })
    return res.json()
  },

  async getVisualStories() {
    const res = await fetch(`${API_BASE}/api/visual-stories`)
    return res.json()
  },

  async getVisualStory(id) {
    const res = await fetch(`${API_BASE}/api/visual-stories/${id}`)
    return res.json()
  },

  async createVisualStory(formData) {
    const res = await fetch(`${API_BASE}/api/visual-stories`, {
      method: 'POST',
      body: formData,
    })
    return res.json()
  },

  async deleteVisualStory(id) {
    const res = await fetch(`${API_BASE}/api/visual-stories/${id}`, { method: 'DELETE' })
    return res.json()
  },

  async getAbout() {
    const res = await fetch(`${API_BASE}/api/about`)
    return res.json()
  },

  async updateAbout(formData) {
    const res = await fetch(`${API_BASE}/api/about`, {
      method: 'PUT',
      body: formData,
    })
    return res.json()
  },

  async getSettings() { // #genai
    const res = await fetch(`${API_BASE}/api/settings`)
    return res.json()
  },

  async updateHeroImage(formData) { // #genai
    const res = await fetch(`${API_BASE}/api/settings/hero-image`, {
      method: 'PUT',
      body: formData,
    })
    return res.json()
  },

  imageUrl(path) {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_BASE}${path}`
  },
}

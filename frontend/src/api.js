const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY

/**
 * Shared fetch wrapper. Throws a descriptive Error on non-2xx responses
 * so callers can surface the failure to the user.
 */
async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch (_) { /* ignore parse error */ }
    throw new Error(detail)
  }
  return res.json()
}

/** Headers to include in every write request. */
function adminHeaders() {
  return ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}
}

export const api = {
  async getWritings(featured) {
    const params = featured !== undefined ? `?featured=${featured}` : ''
    return request(`${API_BASE}/api/writings${params}`)
  },

  async getWriting(id) {
    return request(`${API_BASE}/api/writings/${id}`)
  },

  async createWriting(formData) {
    return request(`${API_BASE}/api/writings`, {
      method: 'POST',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async updateWriting(id, formData) {
    return request(`${API_BASE}/api/writings/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async deleteWriting(id) {
    return request(`${API_BASE}/api/writings/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })
  },

  async getFragments() {
    return request(`${API_BASE}/api/fragments`)
  },

  async getFragment(id) {
    return request(`${API_BASE}/api/fragments/${id}`)
  },

  async createFragment(formData) {
    return request(`${API_BASE}/api/fragments`, {
      method: 'POST',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async updateFragment(id, formData) {
    return request(`${API_BASE}/api/fragments/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async deleteFragment(id) {
    return request(`${API_BASE}/api/fragments/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })
  },

  async getVisualStories() {
    return request(`${API_BASE}/api/visual-stories`)
  },

  async getVisualStory(id) {
    return request(`${API_BASE}/api/visual-stories/${id}`)
  },

  async createVisualStory(formData) {
    return request(`${API_BASE}/api/visual-stories`, {
      method: 'POST',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async updateVisualStory(id, formData) {
    return request(`${API_BASE}/api/visual-stories/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async deleteVisualStory(id) {
    return request(`${API_BASE}/api/visual-stories/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })
  },

  async getAbout() {
    return request(`${API_BASE}/api/about`)
  },

  async updateAbout(formData) {
    return request(`${API_BASE}/api/about`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: formData,
    })
  },

  async getSettings() {
    return request(`${API_BASE}/api/settings`)
  },

  async updateHeroImage(formData) {
    return request(`${API_BASE}/api/settings/hero-image`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: formData,
    })
  },

  imageUrl(path) {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_BASE}${path}`
  },
}

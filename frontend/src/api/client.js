/*
Frontend API client configuration
This file should be in frontend/src/api/client.js or similar
*/

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = {
  async screenshot(imageData) {
    return fetch(`${API_BASE_URL}/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    }).then(r => r.json())
  },

  async getScreenshots() {
    return fetch(`${API_BASE_URL}/screenshots`)
      .then(r => r.json())
  },

  async processImage(imageData, type) {
    return fetch(`${API_BASE_URL}/process-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData, type })
    }).then(r => r.json())
  },

  async getShirt(name) {
    return `${API_BASE_URL}/shirts/${name}`
  }
}

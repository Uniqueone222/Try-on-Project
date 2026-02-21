import { useEffect, useRef, useState } from 'react'
import TryOnCanvas from './components/TryOnCanvas'
import Controls from './components/Controls'
import './App.css'

function App() {
  const [currentShirt, setCurrentShirt] = useState('shirt1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedShirt, setUploadedShirt] = useState(null)

  const changeShirt = (shirtId) => {
    setCurrentShirt(shirtId)
  }

  const handleShirtUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setError(null)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result
      if (typeof dataUrl === 'string') {
        setUploadedShirt({
          name: file.name,
          image: dataUrl
        })
        setCurrentShirt('custom')
        console.log('Shirt uploaded successfully')
      }
    }
    
    reader.onerror = () => {
      setError('Failed to read file')
    }
    
    reader.readAsDataURL(file)
  }

  const handleScreenshot = async () => {
    setLoading(true)
    setError(null)
    try {
      const canvas = document.querySelector('canvas')
      const imageData = canvas.toDataURL('image/png')
      
      // Get API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      // Send to backend for processing
      const response = await fetch(`${apiUrl}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Screenshot saved:', data.filename)
        // You can add download functionality here
      }
    } catch (err) {
      setError('Failed to save screenshot: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      {error && <div className="error-message">{error}</div>}
      <TryOnCanvas 
        currentShirt={currentShirt} 
        uploadedShirt={uploadedShirt}
      />
      <Controls 
        onShirtChange={changeShirt}
        onShirtUpload={handleShirtUpload}
        onScreenshot={handleScreenshot}
        loading={loading}
        hasUploadedShirt={!!uploadedShirt}
      />
    </div>
  )
}

export default App

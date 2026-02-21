import { useEffect, useRef, useState } from 'react'
import TryOnCanvas from './components/TryOnCanvas'
import Controls from './components/Controls'
import './App.css'

function App() {
  const [currentShirt, setCurrentShirt] = useState('shirt1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const changeShirt = (shirtId) => {
    setCurrentShirt(shirtId)
  }

  const handleScreenshot = async () => {
    setLoading(true)
    setError(null)
    try {
      const canvas = document.querySelector('canvas')
      const imageData = canvas.toDataURL('image/png')
      
      // Send to backend for processing
      const response = await fetch('/api/screenshot', {
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
      <TryOnCanvas currentShirt={currentShirt} />
      <Controls 
        onShirtChange={changeShirt} 
        onScreenshot={handleScreenshot}
        loading={loading}
      />
    </div>
  )
}

export default App

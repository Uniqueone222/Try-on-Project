import { useEffect, useRef, useState } from 'react'
import TryOnCanvas from './components/TryOnCanvas'
import Controls from './components/Controls'
import './App.css'

function App() {
  const [currentShirt, setCurrentShirt] = useState('shirt1')
  const [clothingType, setClothingType] = useState('shirt') // shirt, pants, jeans
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedShirt, setUploadedShirt] = useState(null)

  const changeShirt = (shirtId) => {
    setCurrentShirt(shirtId)
  }

  const changeClothingType = (type) => {
    setClothingType(type)
  }

  const handleShirtUpload = async (event) => {
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
    setLoading(true)

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        const dataUrl = e.target?.result
        if (typeof dataUrl !== 'string') {
          setError('Failed to read file')
          setLoading(false)
          return
        }

        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

          // Send to backend for background removal and cropping
          console.log('Processing uploaded shirt...')
          const response = await fetch(`${apiUrl}/process-shirt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: dataUrl })
          })

          if (!response.ok) {
            throw new Error('Backend processing failed')
          }

          const result = await response.json()

          if (result.status === 'success') {
            setUploadedShirt({
              name: file.name,
              image: result.image, // Use processed image
              proportions: result.proportions // Store shirt proportions for alignment
            })
            setCurrentShirt('custom')
            console.log('Shirt processed successfully:', result.info)
            console.log('Shirt proportions:', result.proportions)
          } else {
            setError('Failed to process shirt')
          }
        } catch (err) {
          setError('Failed to process shirt: ' + err.message)
          console.error(err)
        } finally {
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setLoading(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      setError('Upload failed: ' + err.message)
      setLoading(false)
    }

    // Reset input
    event.target.value = ''
  }

  const handleScreenshot = async () => {
    setLoading(true)
    setError(null)
    try {
      const canvas = document.querySelector('canvas')
      const imageData = canvas.toDataURL('image/png')

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
        clothingType={clothingType}
      />
      <Controls
        onShirtChange={changeShirt}
        onClothingTypeChange={changeClothingType}
        clothingType={clothingType}
        onShirtUpload={handleShirtUpload}
        onScreenshot={handleScreenshot}
        loading={loading}
        hasUploadedShirt={!!uploadedShirt}
      />
    </div>
  )
}

export default App

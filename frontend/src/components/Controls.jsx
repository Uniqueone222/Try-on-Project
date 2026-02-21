import { useRef, useState } from 'react'
import './Controls.css'

const Controls = ({ onShirtChange, onShirtUpload, onScreenshot, loading, hasUploadedShirt }) => {
  const fileInputRef = useRef(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <div className="controls">
        <button 
          className="shirt-btn"
          onClick={() => onShirtChange('shirt1')}
        >
          Shirt 1
        </button>
        <button 
          className="shirt-btn"
          onClick={() => onShirtChange('shirt2')}
        >
          Shirt 2
        </button>
        
        <button 
          className={`upload-btn ${hasUploadedShirt ? 'active' : ''}`}
          onClick={handleUploadClick}
        >
          {hasUploadedShirt ? '📸 Custom' : '⬆ Upload Shirt'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onShirtUpload}
          style={{ display: 'none' }}
          aria-label="Upload shirt image"
        />
        
        <button 
          className="screenshot-btn"
          onClick={onScreenshot}
          disabled={loading}
        >
          {loading ? 'Saving...' : '📷 Screenshot'}
        </button>

        <button 
          className="debug-btn"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? '✓ Debug' : '🔧 Debug'}
        </button>
      </div>

      {showDebug && (
        <div className="debug-panel">
          <div className="debug-item">
            <strong>Custom Shirt:</strong> {hasUploadedShirt ? 'Loaded' : 'None'}
          </div>
          <div className="debug-item">
            <strong>Tip:</strong> Make sure your shoulders are visible and entire upper body is in frame
          </div>
          <div className="debug-item">
            <strong>Check Console:</strong> Press F12 to see detailed loading info
          </div>
        </div>
      )}
    </>
  )
}

export default Controls

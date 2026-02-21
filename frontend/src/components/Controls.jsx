import { useRef } from 'react'
import './Controls.css'

const Controls = ({ onShirtChange, onShirtUpload, onScreenshot, loading, hasUploadedShirt }) => {
  const fileInputRef = useRef(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
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
        className="upload-btn"
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
    </div>
  )
}

export default Controls

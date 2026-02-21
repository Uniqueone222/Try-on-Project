import './Controls.css'

const Controls = ({ onShirtChange, onScreenshot, loading }) => {
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
        className="screenshot-btn"
        onClick={onScreenshot}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Screenshot'}
      </button>
    </div>
  )
}

export default Controls

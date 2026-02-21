import { useEffect, useRef, useState } from 'react'
import './TryOnCanvas.css'

const TryOnCanvas = ({ currentShirt, uploadedShirt }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const shirtRef = useRef(new Image())
  const [shirtLoaded, setShirtLoaded] = useState(false)
  const smoothValuesRef = useRef({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })

  // Initialize MediaPipe Pose
  const poseRef = useRef(null)

  useEffect(() => {
    const initPose = async () => {
      // Use global Pose from CDN
      if (typeof window.Pose === 'undefined') {
        console.error('MediaPipe Pose library not loaded')
        return
      }

      const pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      })

      pose.onResults(onPoseResults)
      poseRef.current = pose
    }

    initPose()
  }, [])

  // Load shirt image
  useEffect(() => {
    setShirtLoaded(false)
    const shirt = shirtRef.current
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    // Add timestamp to help identify effect calls
    const timestamp = Date.now()
    console.log(`[${timestamp}] Shirt loading effect triggered for: ${currentShirt}`)
    
    // Reset previous handlers
    shirt.onload = null
    shirt.onerror = null
    
    shirt.onload = () => {
      console.log(`[${timestamp}] Shirt loaded: ${currentShirt}`)
      console.log(`[${timestamp}] Dimensions: ${shirt.naturalWidth}x${shirt.naturalHeight}`)
      setShirtLoaded(true)
    }
    
    shirt.onerror = (error) => {
      console.error(`[${timestamp}] Failed to load shirt ${currentShirt}:`, error)
      setShirtLoaded(false)
    }
    
    // Use uploaded shirt if available and selected
    if (currentShirt === 'custom' && uploadedShirt) {
      console.log(`[${timestamp}] Loading custom uploaded shirt: ${uploadedShirt.name}`)
      shirt.crossOrigin = 'anonymous'
      shirt.src = uploadedShirt.image
    } else {
      console.log(`[${timestamp}] Loading preset shirt: ${currentShirt}`)
      shirt.src = `${apiUrl}/shirts/${currentShirt}.png`
    }
  }, [currentShirt, uploadedShirt])

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        videoRef.current.srcObject = stream
        console.log('Back camera started')
      } catch (error) {
        console.log('Back camera failed, trying front camera')
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          })
          videoRef.current.srcObject = stream
          console.log('Front camera started')
        } catch (fallbackError) {
          console.error('Camera access denied', fallbackError)
          alert('Camera access is required for the Virtual Try-On app.')
        }
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      startCamera()
    } else {
      alert('Your browser does not support camera access.')
    }

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Setup canvas context
  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d')
    }
  }, [])

  // Process pose results
  const onPoseResults = (results) => {
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = ctxRef.current

      if (!video.videoWidth || !ctx || !canvas) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw camera frame
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      } catch (error) {
        console.warn('Failed to draw video frame:', error)
        return
      }

      if (!results.poseLandmarks || results.poseLandmarks.length === 0) return

      const landmarks = results.poseLandmarks
      
      // Draw pose landmarks visualization
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // Draw skeleton connections
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.fillStyle = '#00FF00'
      
      // Key connections for skeleton
      const connections = [
        [11, 12], // shoulders
        [11, 13], // left shoulder to elbow
        [13, 15], // left elbow to wrist
        [12, 14], // right shoulder to elbow
        [14, 16], // right elbow to wrist
        [11, 23], // left shoulder to hip
        [12, 24], // right shoulder to hip
        [23, 24], // hips
        [23, 25], // left hip to knee
        [25, 27], // left knee to ankle
        [24, 26], // right hip to knee
        [26, 28], // right knee to ankle
      ]
      
      // Draw connections
      connections.forEach(([start, end]) => {
        const startLandmark = landmarks[start]
        const endLandmark = landmarks[end]
        
        if (startLandmark && endLandmark && 
            startLandmark.visibility > 0.3 && endLandmark.visibility > 0.3) {
          ctx.beginPath()
          ctx.moveTo(startLandmark.x * canvasWidth, startLandmark.y * canvasHeight)
          ctx.lineTo(endLandmark.x * canvasWidth, endLandmark.y * canvasHeight)
          ctx.stroke()
        }
      })
      
      // Draw landmark points
      landmarks.forEach((landmark, idx) => {
        if (landmark.visibility > 0.3) {
          const x = landmark.x * canvasWidth
          const y = landmark.y * canvasHeight
          
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()
          
          // Draw confidence text for key points
          if ([11, 12, 23, 24].includes(idx)) {
            ctx.fillStyle = '#FFFFFF'
            ctx.font = '12px Arial'
            ctx.fillText(`${idx}`, x + 8, y)
            ctx.fillStyle = '#00FF00'
          }
        }
      })
      
      // Highlight shoulders and hips
      const leftShoulder = landmarks[11]
      const rightShoulder = landmarks[12]
      const leftHip = landmarks[23]
      const rightHip = landmarks[24]

      // Check if shoulders are detected
      if (!leftShoulder || !rightShoulder) {
        console.warn('Shoulders not detected')
        return
      }
      if (leftShoulder.visibility < 0.1 || rightShoulder.visibility < 0.1) {
        console.warn('Shoulders not visible enough:', {
          left: leftShoulder.visibility,
          right: rightShoulder.visibility
        })
        return
      }

      const shoulderX1 = leftShoulder.x * canvasWidth
      const shoulderY1 = leftShoulder.y * canvasHeight
      const shoulderX2 = rightShoulder.x * canvasWidth

      const shoulderWidth = Math.abs(shoulderX2 - shoulderX1)

      if (shoulderWidth < 50) return // ignore bad detection

      // Only draw shirt if it loaded successfully
      const shirt = shirtRef.current
      if (!shirtLoaded) {
        console.warn('Shirt not loaded yet')
        return
      }
      if (!shirt.naturalWidth || !shirt.naturalHeight) {
        console.warn('Shirt dimensions missing:', {
          width: shirt.naturalWidth,
          height: shirt.naturalHeight
        })
        return
      }

      const shirtAspectRatio = shirt.naturalHeight / shirt.naturalWidth
      const targetWidth = shoulderWidth * 1.4
      const targetHeight = targetWidth * shirtAspectRatio
      const centerX = (shoulderX1 + shoulderX2) / 2
      const targetX = centerX - targetWidth / 2
      const targetY = shoulderY1 - targetHeight * 0.15

      // Smooth values
      smoothValuesRef.current.width = smoothValuesRef.current.width * 0.7 + targetWidth * 0.3
      smoothValuesRef.current.height = smoothValuesRef.current.height * 0.7 + targetHeight * 0.3
      smoothValuesRef.current.x = smoothValuesRef.current.x * 0.7 + targetX * 0.3
      smoothValuesRef.current.y = smoothValuesRef.current.y * 0.7 + targetY * 0.3

      // Draw shirt with error handling
      try {
        ctx.globalAlpha = 0.8
        ctx.drawImage(
          shirt,
          smoothValuesRef.current.x,
          smoothValuesRef.current.y,
          smoothValuesRef.current.width,
          smoothValuesRef.current.height
        )
        ctx.globalAlpha = 1
      } catch (error) {
        console.warn('Failed to draw shirt image:', error)
      }
    } catch (error) {
      console.error('Pose detection processing error:', error)
    }
  }

  // Connect camera to pose detector and start detection loop
  useEffect(() => {
    const video = videoRef.current
    const pose = poseRef.current

    if (!video || !pose) return

    const handleLoadedData = async () => {
      const detect = async () => {
        try {
          await pose.send({ image: video })
        } catch (error) {
          console.error('Pose detection error:', error)
        }
        requestAnimationFrame(detect)
      }
      detect()
    }

    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  // Handle window resize for mobile orientation
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (video?.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="tryon-canvas-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-input"
      />
      <canvas
        ref={canvasRef}
        className="output-canvas"
      />
    </div>
  )
}

export default TryOnCanvas

import { useEffect, useRef } from 'react'
import './TryOnCanvas.css'

const TryOnCanvas = ({ currentShirt }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const shirtRef = useRef(new Image())
  const smoothValuesRef = useRef({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })

  // Shirt images mapping
  const shirtImages = {
    shirt1: '/api/shirts/shirt1.png',
    shirt2: '/api/shirts/shirt2.png'
  }

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
    const shirt = shirtRef.current
    shirt.src = shirtImages[currentShirt]
    
    shirt.onload = () => {
      console.log(`Shirt ${currentShirt} loaded`)
    }
    
    shirt.onerror = () => {
      console.error(`Failed to load shirt ${currentShirt}`)
    }
  }, [currentShirt])

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
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = ctxRef.current

    if (!video.videoWidth || !ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (!results.poseLandmarks) return

    const landmarks = results.poseLandmarks
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    const shoulderX1 = leftShoulder.x * canvas.width
    const shoulderY1 = leftShoulder.y * canvas.height
    const shoulderX2 = rightShoulder.x * canvas.width

    const shoulderWidth = Math.abs(shoulderX2 - shoulderX1)

    if (shoulderWidth < 50) return // ignore bad detection

    const shirt = shirtRef.current
    if (!shirt.complete) return

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

    // Draw shirt
    ctx.drawImage(
      shirt,
      smoothValuesRef.current.x,
      smoothValuesRef.current.y,
      smoothValuesRef.current.width,
      smoothValuesRef.current.height
    )
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

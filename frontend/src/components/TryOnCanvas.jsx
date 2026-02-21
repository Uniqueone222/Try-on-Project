import { useEffect, useRef, useState } from 'react'
import './TryOnCanvas.css'

// Clothing config templates (width, length, fit, etc.)
const CLOTHING_CONFIGS = {
  shirt: {
    name: 'T-Shirt',
    shoulderScale: 1.4,
    lengthRatio: 0.75,
    hipSpreadFactor: 1.0,  // Standard fit at hips
    startYOffset: 0.15
  },
  pants: {
    name: 'Pants',
    shoulderScale: 1.1,
    lengthRatio: 1.4,  // Longer - extends to ankles
    hipSpreadFactor: 1.2,  // Wider at hips for pants
    startYOffset: 0.28  // Start at hip level
  },
  jeans: {
    name: 'Jeans',
    shoulderScale: 1.0,
    lengthRatio: 1.45,  // Similar to pants
    hipSpreadFactor: 1.15,  // Slightly less spread than pants
    startYOffset: 0.28
  }
}

const TryOnCanvas = ({ currentShirt, uploadedShirt, clothingType = 'shirt' }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const shirtRef = useRef(new Image())
  const shirtLoadedRef = useRef(false)
  const [shirtLoaded, setShirtLoaded] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const smoothValuesRef = useRef({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })
  const frameCountRef = useRef(0)

  // Get current clothing config
  const currentConfig = CLOTHING_CONFIGS[clothingType] || CLOTHING_CONFIGS.shirt

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

  // Refresh shirt image every 5 seconds (without resetting load state)
  useEffect(() => {
    const interval = setInterval(() => {
      // Just force canvas re-render, don't reset loaded state
      if (shirtLoadedRef.current && shirtRef.current.src) {
        // Re-request pose detection to refresh without unloading shirt
        setRefreshCounter(prev => prev + 1)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Load shirt image
  useEffect(() => {
    setShirtLoaded(false)
    shirtLoadedRef.current = false
    const shirt = shirtRef.current

    // Determine API URL from environment variable
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    // Add timestamp to help identify effect calls
    const timestamp = Date.now()
    console.log(`[${timestamp}] Shirt loading effect triggered for: ${currentShirt}`)
    console.log(`[${timestamp}] Hostname: ${window.location.hostname}`)
    console.log(`[${timestamp}] Using API URL: ${apiUrl}`)

    // Reset previous handlers
    shirt.onload = null
    shirt.onerror = null

    shirt.onload = () => {
      console.log(`[${timestamp}] Shirt loaded: ${currentShirt}`)
      console.log(`[${timestamp}] Dimensions: ${shirt.naturalWidth}x${shirt.naturalHeight}`)
      setShirtLoaded(true)
      shirtLoadedRef.current = true
    }

    shirt.onerror = (error) => {
      console.error(`[${timestamp}] Failed to load shirt ${currentShirt}:`, error)
      setShirtLoaded(false)
      shirtLoadedRef.current = false
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
  }, [currentShirt, uploadedShirt, refreshCounter])

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
      const leftWrist = landmarks[15]
      const rightWrist = landmarks[16]
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
      const shoulderY2 = rightShoulder.y * canvasHeight

      // Calculate shoulder angle (rotation)
      const shoulderAngle = Math.atan2(shoulderY2 - shoulderY1, shoulderX2 - shoulderX1)

      frameCountRef.current++

      // Get wrist positions for sleeve angles (if visible)
      let leftWristX = shoulderX1
      let leftWristY = shoulderY1
      let rightWristX = shoulderX2
      let rightWristY = shoulderY2
      let leftArmAngle = 0
      let rightArmAngle = 0

      if (leftWrist && leftWrist.visibility > 0.1) {
        leftWristX = leftWrist.x * canvasWidth
        leftWristY = leftWrist.y * canvasHeight
        leftArmAngle = Math.atan2(leftWristY - shoulderY1, leftWristX - shoulderX1)
      }

      if (rightWrist && rightWrist.visibility > 0.1) {
        rightWristX = rightWrist.x * canvasWidth
        rightWristY = rightWrist.y * canvasHeight
        rightArmAngle = Math.atan2(rightWristY - shoulderY2, rightWristX - shoulderX2)
      }

      // Debug: Log angles periodically (every 30 frames)
      if (frameCountRef.current % 30 === 0) {
        console.log('Pose angles:', {
          shoulderAngleDeg: (shoulderAngle * 180 / Math.PI).toFixed(1),
          leftArmAngleDeg: (leftArmAngle * 180 / Math.PI).toFixed(1),
          rightArmAngleDeg: (rightArmAngle * 180 / Math.PI).toFixed(1)
        })
      }

      const shoulderWidth = Math.abs(shoulderX2 - shoulderX1)

      if (shoulderWidth < 50) return // ignore bad detection

      // Calculate hip positions with spread factor (for pants/jeans)
      let hipSpreadX1 = shoulderX1
      let hipSpreadX2 = shoulderX2
      if (leftHip && rightHip && leftHip.visibility > 0.1 && rightHip.visibility > 0.1) {
        const hipX1 = leftHip.x * canvasWidth
        const hipX2 = rightHip.x * canvasWidth
        const hipWidth = Math.abs(hipX2 - hipX1)

        // Apply hip spread factor (stretches hips for pants/jeans fit)
        const hipCenter = (hipX1 + hipX2) / 2
        hipSpreadX1 = hipCenter - (hipWidth * currentConfig.hipSpreadFactor) / 2
        hipSpreadX2 = hipCenter + (hipWidth * currentConfig.hipSpreadFactor) / 2

        console.log('Hip spread applied:', {
          factor: currentConfig.hipSpreadFactor,
          originalWidth: hipWidth.toFixed(0),
          newWidth: (hipSpreadX2 - hipSpreadX1).toFixed(0)
        })
      }

      // Only draw shirt if it loaded successfully
      const shirt = shirtRef.current
      if (!shirtLoadedRef.current) {
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

      // Calculate shirt positioning using proportions (if available) or default
      let targetWidth, targetHeight, targetX, targetY

      const bodyShoulderWidth = Math.abs(shoulderX2 - shoulderX1)
      const centerX = (shoulderX1 + shoulderX2) / 2

      // Check if this is a custom shirt with proportions
      if (currentShirt === 'custom' && uploadedShirt?.proportions) {
        const props = uploadedShirt.proportions

        // Calculate shirt's shoulder width in normalized coordinates
        const shirtShoulderWidthNormalized = props.right_shoulder.x - props.left_shoulder.x

        // Scale shirt so its shoulders match body shoulders
        // Body shoulder width / Shirt shoulder width = scale factor
        const scale = bodyShoulderWidth / (shirtShoulderWidthNormalized * shirt.naturalWidth)

        targetWidth = shirt.naturalWidth * scale
        targetHeight = shirt.naturalHeight * scale

        // Position so shirt's shoulder points align with body shoulders
        const shirtLeftShoulderX = props.left_shoulder.x * targetWidth
        targetX = centerX - shirtLeftShoulderX - (targetWidth / 2 - shirtLeftShoulderX)

        // Align shirt's shoulder Y to body shoulder Y with slight offset
        const shirtShoulderY = props.left_shoulder.y * targetHeight
        targetY = shoulderY1 - shirtShoulderY

        console.log('Using custom shirt proportions for alignment', {
          scale: scale.toFixed(2),
          bodyShoulderWidth: bodyShoulderWidth.toFixed(0),
          shirtTargetWidth: targetWidth.toFixed(0),
          clothingType: currentConfig.name
        })
      } else {
        // Default alignment for preset shirts - use clothing config
        targetWidth = bodyShoulderWidth * currentConfig.shoulderScale
        targetHeight = targetWidth * (shirt.naturalHeight / shirt.naturalWidth) * currentConfig.lengthRatio
        targetX = centerX - targetWidth / 2
        targetY = shoulderY1 - targetHeight * currentConfig.startYOffset
      }

      // Smooth values for animation
      smoothValuesRef.current.width = smoothValuesRef.current.width * 0.7 + targetWidth * 0.3
      smoothValuesRef.current.height = smoothValuesRef.current.height * 0.7 + targetHeight * 0.3
      smoothValuesRef.current.x = smoothValuesRef.current.x * 0.7 + targetX * 0.3
      smoothValuesRef.current.y = smoothValuesRef.current.y * 0.7 + targetY * 0.3

      // Draw shirt with rotation based on shoulder angle
      try {
        ctx.save()

        // Calculate rotation center (shoulder midpoint)
        const rotationCenterX = (shoulderX1 + shoulderX2) / 2
        const rotationCenterY = (shoulderY1 + shoulderY2) / 2

        // Apply rotation transformation
        ctx.translate(rotationCenterX, rotationCenterY)
        ctx.rotate(shoulderAngle)
        ctx.translate(-rotationCenterX, -rotationCenterY)

        // Draw shirt
        ctx.globalAlpha = 0.8
        ctx.drawImage(
          shirt,
          smoothValuesRef.current.x,
          smoothValuesRef.current.y,
          smoothValuesRef.current.width,
          smoothValuesRef.current.height
        )
        ctx.globalAlpha = 1

        ctx.restore()

        // Draw sleeves based on arm angles
        const sleeveLength = targetHeight * 0.4  // Sleeve extends from shoulder
        const sleeveWidth = targetWidth * 0.15   // Sleeve width relative to shirt

        // Left sleeve (follows left arm)
        if (leftWrist && leftWrist.visibility > 0.1) {
          ctx.save()
          ctx.translate(shoulderX1, shoulderY1)
          ctx.rotate(leftArmAngle)

          // Draw left sleeve
          ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'  // Semi-transparent blue overlay
          ctx.fillRect(0, -sleeveWidth / 2, sleeveLength, sleeveWidth)

          // Sleeve end outline
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)'
          ctx.lineWidth = 2
          ctx.strokeRect(0, -sleeveWidth / 2, sleeveLength, sleeveWidth)

          ctx.restore()
        }

        // Right sleeve (follows right arm)
        if (rightWrist && rightWrist.visibility > 0.1) {
          ctx.save()
          ctx.translate(shoulderX2, shoulderY2)
          ctx.rotate(rightArmAngle)

          // Draw right sleeve
          ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'  // Semi-transparent blue overlay
          ctx.fillRect(0, -sleeveWidth / 2, sleeveLength, sleeveWidth)

          // Sleeve end outline
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)'
          ctx.lineWidth = 2
          ctx.strokeRect(0, -sleeveWidth / 2, sleeveLength, sleeveWidth)

          ctx.restore()
        }

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

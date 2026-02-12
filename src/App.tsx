import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const EDGE_PADDING = 12
const COPY = {
  intro: 'Hey Alix',
  question: 'Will you be my Valentine?',
  successTitle: 'Yay!! 💘',
  successMessage: "Best answer. Cozy Valentine's at home with our little crew 🥰",
  signoff: "Today's deal: infinite coffee and whatever food you want, whenever you want it.",
}
const REASONS = [
  "You keep the house running when I'm gone, and somehow everything still works.",
  'You handle bedtime with both kids solo and make it look way less chaotic than it is.',
  "You keep our kids safe, loved, and entertained while I'm out here losing to the kitchen.",
  "You make me do things that are good for me, and yes, I hate that you're usually right.",
  'Our nightly couch reset and doing nothing together are still my favorite parts of every day.',
]

function App() {
  const [accepted, setAccepted] = useState(false)
  const [reasonIndex, setReasonIndex] = useState(0)
  const [noPos, setNoPos] = useState({ x: 0, y: 0 })
  const [noReady, setNoReady] = useState(false)
  const playAreaRef = useRef<HTMLDivElement>(null)
  const noButtonRef = useRef<HTMLButtonElement>(null)

  const getPlayAreaMetrics = useCallback(() => {
    const playArea = playAreaRef.current
    const noButton = noButtonRef.current

    if (!playArea || !noButton) {
      return null
    }

    const minX = EDGE_PADDING
    const minY = EDGE_PADDING
    const maxX = Math.max(minX, playArea.clientWidth - noButton.offsetWidth - EDGE_PADDING)
    const maxY = Math.max(minY, playArea.clientHeight - noButton.offsetHeight - EDGE_PADDING)

    return { minX, minY, maxX, maxY }
  }, [])

  const positionNoButton = useCallback(
    (mode: 'initial' | 'random' | 'clamp') => {
      const metrics = getPlayAreaMetrics()
      if (!metrics) {
        return
      }

      setNoPos((current) => {
        if (mode === 'initial') {
          return {
            x: metrics.maxX,
            y: metrics.maxY,
          }
        }

        if (mode === 'clamp') {
          return {
            x: Math.min(metrics.maxX, Math.max(metrics.minX, current.x)),
            y: Math.min(metrics.maxY, Math.max(metrics.minY, current.y)),
          }
        }

        const rangeX = metrics.maxX - metrics.minX
        const rangeY = metrics.maxY - metrics.minY
        const maxDistance = Math.hypot(rangeX, rangeY)
        const minJumpDistance = maxDistance * 0.5

        const randomPoint = () => ({
          x: metrics.minX + Math.random() * (rangeX || 1),
          y: metrics.minY + Math.random() * (rangeY || 1),
        })

        for (let attempt = 0; attempt < 18; attempt += 1) {
          const next = randomPoint()
          const distance = Math.hypot(next.x - current.x, next.y - current.y)
          if (distance >= minJumpDistance) {
            return next
          }
        }

        const corners = [
          { x: metrics.minX, y: metrics.minY },
          { x: metrics.minX, y: metrics.maxY },
          { x: metrics.maxX, y: metrics.minY },
          { x: metrics.maxX, y: metrics.maxY },
        ]

        return corners.reduce((farthest, corner) =>
          Math.hypot(corner.x - current.x, corner.y - current.y) >
          Math.hypot(farthest.x - current.x, farthest.y - current.y)
            ? corner
            : farthest,
        )
      })

      setNoReady(true)
    },
    [getPlayAreaMetrics],
  )

  useEffect(() => {
    positionNoButton('initial')
  }, [positionNoButton])

  useEffect(() => {
    const onResize = () => positionNoButton('clamp')
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [positionNoButton])

  useEffect(() => {
    if (!accepted) {
      return
    }

    const intervalId = window.setInterval(() => {
      setReasonIndex((current) => (current + 1) % REASONS.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [accepted])

  const dodgeNoButton = () => {
    positionNoButton('random')
  }

  return (
    <main className="app">
      <section className="card" aria-live="polite">
        <p className="tagline">{COPY.intro}</p>
        <h1 className="title">{accepted ? COPY.successTitle : COPY.question}</h1>

        {accepted && (
          <>
            <p className="message">{COPY.successMessage}</p>
            <p className="reason-label">Why I love you:</p>
            <p className="reason-text">{REASONS[reasonIndex]}</p>
            <p className="signoff">{COPY.signoff}</p>
          </>
        )}

        {!accepted && (
          <div className="play-area" ref={playAreaRef}>
            <button className="action-btn yes-btn" type="button" onClick={() => setAccepted(true)}>
              Yes
            </button>
            <button
              className="action-btn no-btn"
              ref={noButtonRef}
              type="button"
              onPointerEnter={dodgeNoButton}
              onPointerDown={dodgeNoButton}
              onTouchStart={dodgeNoButton}
              onFocus={dodgeNoButton}
              style={{
                transform: `translate(${noPos.x}px, ${noPos.y}px)`,
                opacity: noReady ? 1 : 0,
              }}
            >
              No
            </button>
          </div>
        )}

        {accepted && (
          <div className="hearts" aria-hidden="true">
            <span>💖</span>
            <span>💘</span>
            <span>💕</span>
            <span>❤️</span>
            <span>💞</span>
            <span>💗</span>
          </div>
        )}
      </section>
    </main>
  )
}

export default App

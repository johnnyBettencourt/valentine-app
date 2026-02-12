import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
const DODGE_LINES = [
  'Nope.',
  'Almost.',
  'Nice try.',
  'Not today.',
  'Still no.',
  'So close.',
]
const EASTER_EGG_AFTER_DODGES = 9
const NO_DEFAULT_LABEL = 'No'

function App() {
  const [accepted, setAccepted] = useState(false)
  const [reasonIndex, setReasonIndex] = useState(0)
  const [noLabel, setNoLabel] = useState(NO_DEFAULT_LABEL)
  const [showConfetti, setShowConfetti] = useState(false)
  const [noPos, setNoPos] = useState({ x: 0, y: 0 })
  const [noReady, setNoReady] = useState(false)
  const [noAnimated, setNoAnimated] = useState(false)
  const noDodgesRef = useRef(0)
  const yesButtonRef = useRef<HTMLButtonElement>(null)
  const noButtonRef = useRef<HTMLButtonElement>(null)

  const getViewportMetrics = useCallback(() => {
    const yesButton = yesButtonRef.current
    const noButton = noButtonRef.current

    if (!yesButton || !noButton) {
      return null
    }

    const noWidth = noButton.offsetWidth
    const noHeight = noButton.offsetHeight
    const minX = EDGE_PADDING
    const minY = EDGE_PADDING
    const maxX = Math.max(minX, window.innerWidth - noWidth - EDGE_PADDING)
    const maxY = Math.max(minY, window.innerHeight - noHeight - EDGE_PADDING)
    const yesRect = yesButton.getBoundingClientRect()

    return {
      minX,
      minY,
      maxX,
      maxY,
      noWidth,
      noHeight,
      yesRect: {
        left: yesRect.left,
        top: yesRect.top,
        right: yesRect.right,
        bottom: yesRect.bottom,
      },
    }
  }, [])

  const positionNoButton = useCallback(
    (mode: 'initial' | 'random' | 'clamp', dodgeCount = 0) => {
      const metrics = getViewportMetrics()
      if (!metrics) {
        return
      }

      setNoPos((current) => {
        if (mode === 'initial') {
          const gap = 12
          const desiredY = Math.min(
            metrics.maxY,
            Math.max(metrics.minY, metrics.yesRect.top),
          )
          const rightOfYes = metrics.yesRect.right + gap
          const leftOfYes = metrics.yesRect.left - metrics.noWidth - gap

          return {
            x:
              rightOfYes <= metrics.maxX
                ? rightOfYes
                : Math.max(metrics.minX, Math.min(metrics.maxX, leftOfYes)),
            y: desiredY,
          }
        }

        if (mode === 'clamp') {
          const clamped = {
            x: Math.min(metrics.maxX, Math.max(metrics.minX, current.x)),
            y: Math.min(metrics.maxY, Math.max(metrics.minY, current.y)),
          }

          const overlapPadding = 6
          const overlapsYes =
            clamped.x < metrics.yesRect.right + overlapPadding &&
            clamped.x + metrics.noWidth > metrics.yesRect.left - overlapPadding &&
            clamped.y < metrics.yesRect.bottom + overlapPadding &&
            clamped.y + metrics.noHeight > metrics.yesRect.top - overlapPadding

          if (!overlapsYes) {
            return clamped
          }

          return {
            x: metrics.maxX,
            y: metrics.minY,
          }
        }

        const rangeX = metrics.maxX - metrics.minX
        const rangeY = metrics.maxY - metrics.minY
        const maxDistance = Math.hypot(rangeX, rangeY)
        const jumpFactor = dodgeCount < 3 ? 0.34 : 0.42
        const minJumpDistance = maxDistance * jumpFactor
        const overlapPadding = 6

        const randomPoint = () => ({
          x: metrics.minX + Math.random() * (rangeX || 1),
          y: metrics.minY + Math.random() * (rangeY || 1),
        })

        const overlapsYes = (x: number, y: number) =>
          x < metrics.yesRect.right + overlapPadding &&
          x + metrics.noWidth > metrics.yesRect.left - overlapPadding &&
          y < metrics.yesRect.bottom + overlapPadding &&
          y + metrics.noHeight > metrics.yesRect.top - overlapPadding

        for (let attempt = 0; attempt < 18; attempt += 1) {
          const next = randomPoint()
          const distance = Math.hypot(next.x - current.x, next.y - current.y)
          if (distance >= minJumpDistance && !overlapsYes(next.x, next.y)) {
            return next
          }
        }

        const corners = [
          { x: metrics.minX, y: metrics.minY },
          { x: metrics.minX, y: metrics.maxY },
          { x: metrics.maxX, y: metrics.minY },
          { x: metrics.maxX, y: metrics.maxY },
        ]

        const validCorners = corners.filter((corner) => !overlapsYes(corner.x, corner.y))
        const candidates = validCorners.length > 0 ? validCorners : corners

        return candidates.reduce((farthest, corner) =>
          Math.hypot(corner.x - current.x, corner.y - current.y) >
          Math.hypot(farthest.x - current.x, farthest.y - current.y)
            ? corner
            : farthest,
        )
      })

      setNoReady(true)
    },
    [getViewportMetrics],
  )

  useLayoutEffect(() => {
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

  useEffect(() => {
    if (!showConfetti) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowConfetti(false)
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [showConfetti])

  const handleYesClick = () => {
    setAccepted(true)
    setShowConfetti(true)
  }

  const dodgeNoButton = () => {
    setNoAnimated(true)
    noDodgesRef.current += 1
    setNoLabel(DODGE_LINES[(noDodgesRef.current - 1) % DODGE_LINES.length])
    positionNoButton('random', noDodgesRef.current)
  }

  return (
    <main className="app">
      <section className="content" aria-live="polite">
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

        {!accepted && noDodgesRef.current >= EASTER_EGG_AFTER_DODGES && (
          <p className="easter-egg easter-egg-floating">okay, this persistence is attractive.</p>
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

      {!accepted && (
        <>
          <button
            className="action-btn yes-btn yes-btn-floating"
            ref={yesButtonRef}
            type="button"
            onClick={handleYesClick}
          >
            Yes
          </button>
          <button
            className={`action-btn no-btn no-btn-floating ${noAnimated ? 'no-btn-animated' : ''}`}
            ref={noButtonRef}
            type="button"
            onPointerEnter={dodgeNoButton}
            onPointerDown={dodgeNoButton}
            onTouchStart={dodgeNoButton}
            onFocus={dodgeNoButton}
            style={{
              transform: `translate3d(${noPos.x}px, ${noPos.y}px, 0)`,
              opacity: noReady ? 1 : 0,
            }}
          >
            {noLabel}
          </button>
        </>
      )}

      {accepted && showConfetti && (
        <div className="confetti" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </main>
  )
}

export default App

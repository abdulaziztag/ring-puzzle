import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

const SUBJECTS = [
  'The homework', 'The project', 'The exam', 'The report', 'The building',
  'The book', 'The article', 'The message', 'The problem', 'The rules',
  'The results', 'The documents', 'The website', 'The system', 'The house',
  'The car', 'The computer', 'Tom', 'She', 'He',
  'They', 'It', 'The students', 'The teacher', 'The company',
  'The government', 'The film', 'The product', 'The speech', 'The experiment'
]

const AUXILIARIES = {
  standard: [
    'is', 'are', 'was', 'were', 'is being', 'are being',
    'has been', 'have been', 'had been', 'will be', 'can be', 'must be'
  ],
  reporting: [
    'is said to', 'are said to', 'is believed to', 'are believed to',
    'is known to', 'is thought to', 'is considered to', 'is expected to'
  ],
  causative: [
    'has had', 'have had', 'had had', 'will have',
    'had', 'should have', 'must have', 'could have'
  ]
}

const PAST_PARTICIPLES = [
  'written', 'prepared', 'completed', 'checked', 'explained',
  'recorded', 'published', 'sent', 'opened', 'closed',
  'changed', 'improved', 'translated', 'corrected', 'printed',
  'repaired', 'cleaned', 'painted', 'built', 'destroyed',
  'announced', 'developed', 'discussed', 'approved', 'invited',
  'stolen', 'discovered', 'finished', 'organized', 'examined'
]

const AGENTS = [
  'by the teacher', 'by the students', 'by the government', 'by experts',
  'by scientists', 'by the manager', 'yesterday', 'today',
  'last year', 'recently', 'at school', 'in the city',
  'at home', 'carefully', 'quickly', 'officially',
  'in 2024', 'during the lesson', 'before the exam', 'by professionals',
  'by a mechanic', 'by a technician', 'at the hospital', 'in the laboratory',
  'worldwide', 'in the media', 'in the news', 'by many people',
  'by researchers', 'step by step', 'with a pencil', 'with a computer',
  'with a smartphone', 'with a microphone', 'with a camera', 'with a key'
]

// Layers from innermost to outermost — bigger sizes, thicker rings
const LAYER_CONFIG = [
  { name: 'Subject', color: '#d4a373', thickness: 140, baseFontSize: 11 },
  { name: 'Auxiliary Verb', color: '#7fb0c8', thickness: 80, baseFontSize: 12 },
  { name: 'Past Participle', color: '#80b192', thickness: 95, baseFontSize: 13 },
  { name: 'Agent', color: '#c9929e', thickness: 90, baseFontSize: 14 },
]

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default function Passivgram() {
  const SIZE = 900
  const CENTER = SIZE / 2
  const SEGMENTS = 8
  const segAngle = 360 / SEGMENTS

  // Compute radii for each layer (innermost first)
  const layerDims = []
  let accR = 0
  for (const layer of LAYER_CONFIG) {
    layerDims.push({ innerR: accR, outerR: accR + layer.thickness })
    accR += layer.thickness
  }

  const svgRef = useRef(null)
  const [mode, setMode] = useState(null)
  const [values, setValues] = useState([
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
  ])
  const [ringAngles, setRingAngles] = useState([0, 0, 0, 0])
  const [isDragging, setIsDragging] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasRotated, setHasRotated] = useState(false)

  // Drag to rotate a ring
  const startRotate = (e, layerIndex) => {
    if (isSpinning) return
    e.preventDefault()
    setIsDragging(true)

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    const initialAngle = ringAngles[layerIndex]

    const onMove = (moveEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI)
      const delta = currentAngle - startAngle
      setRingAngles(prev => {
        const next = [...prev]
        next[layerIndex] = ((initialAngle + delta) % 360 + 360) % 360
        return next
      })
    }

    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    if (hasRotated) {
      setValues(prev => {
        const next = [...prev]
        next[1] = getRandomItems(AUXILIARIES[newMode], 8)
        return next
      })
    }
  }

  const rotate = () => {
    if (!mode || isSpinning) return
    setIsSpinning(true)
    setTimeout(() => {
      setValues([
        getRandomItems(SUBJECTS, 8),
        getRandomItems(AUXILIARIES[mode], 8),
        getRandomItems(PAST_PARTICIPLES, 8),
        getRandomItems(AGENTS, 8),
      ])
      setHasRotated(true)
    }, 800)
    setTimeout(() => {
      setIsSpinning(false)
    }, 1600)
  }

  // SVG path helper
  const segmentPath = (outerR, innerR, startA, endA) => {
    const toRad = a => (a - 90) * Math.PI / 180
    const sr = toRad(startA), er = toRad(endA)
    const la = endA - startA > 180 ? 1 : 0

    if (innerR <= 0) {
      return [
        `M ${CENTER} ${CENTER}`,
        `L ${CENTER + outerR * Math.cos(sr)} ${CENTER + outerR * Math.sin(sr)}`,
        `A ${outerR} ${outerR} 0 ${la} 1 ${CENTER + outerR * Math.cos(er)} ${CENTER + outerR * Math.sin(er)}`,
        'Z'
      ].join(' ')
    }

    return [
      `M ${CENTER + outerR * Math.cos(sr)} ${CENTER + outerR * Math.sin(sr)}`,
      `A ${outerR} ${outerR} 0 ${la} 1 ${CENTER + outerR * Math.cos(er)} ${CENTER + outerR * Math.sin(er)}`,
      `L ${CENTER + innerR * Math.cos(er)} ${CENTER + innerR * Math.sin(er)}`,
      `A ${innerR} ${innerR} 0 ${la} 0 ${CENTER + innerR * Math.cos(sr)} ${CENTER + innerR * Math.sin(sr)}`,
      'Z'
    ].join(' ')
  }

  // Text rendering — bottom of text always faces the center
  const renderText = (text, x, y, fontSize, segIndex) => {
    if (!text) return null
    const rotation = segIndex * segAngle + segAngle / 2
    const words = text.split(' ')

    if (words.length <= 1 || text.length <= 9) {
      return (
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fill="#1a1a2e" fontSize={fontSize} fontWeight="700"
          transform={`rotate(${rotation} ${x} ${y})`}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {text}
        </text>
      )
    }

    const mid = Math.ceil(words.length / 2)
    const line1 = words.slice(0, mid).join(' ')
    const line2 = words.slice(mid).join(' ')
    const lh = fontSize * 1.25

    return (
      <text textAnchor="middle" fill="#1a1a2e" fontSize={fontSize} fontWeight="700"
        transform={`rotate(${rotation} ${x} ${y})`}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        <tspan x={x} y={y - lh * 0.4}>{line1}</tspan>
        <tspan x={x} y={y + lh * 0.6}>{line2}</tspan>
      </text>
    )
  }

  // Render outermost first so inner layers paint on top
  const renderOrder = [3, 2, 1, 0]

  const spinConfigs = [
    { deg: 1080, dur: 1.4 },
    { deg: -1440, dur: 1.5 },
    { deg: 1800, dur: 1.3 },
    { deg: -1080, dur: 1.6 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
      {/* Back link */}
      <Link to="/"
        className="fixed top-6 left-6 text-blue-200 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1 z-10">
        &larr; Grammar Builder
      </Link>

      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-bold text-white mb-2">PassiveGram</h1>

        {/* Mode Selector */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-blue-200 text-sm font-semibold tracking-wider uppercase">Mode</span>
          <div className="flex gap-3">
            {['standard', 'reporting', 'causative'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  mode === m
                    ? 'bg-white text-purple-900 shadow-lg scale-105'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Diagram */}
        <div className="relative">
          <style>{`
            @keyframes pSpin0 { from{transform:rotate(0)} to{transform:rotate(${spinConfigs[0].deg}deg)} }
            @keyframes pSpin1 { from{transform:rotate(0)} to{transform:rotate(${spinConfigs[1].deg}deg)} }
            @keyframes pSpin2 { from{transform:rotate(0)} to{transform:rotate(${spinConfigs[2].deg}deg)} }
            @keyframes pSpin3 { from{transform:rotate(0)} to{transform:rotate(${spinConfigs[3].deg}deg)} }
          `}</style>

          <svg ref={svgRef} width={SIZE} height={SIZE} className="drop-shadow-2xl"
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}>
            <rect width={SIZE} height={SIZE} fill="#1a1a2e" rx="20" />

            {renderOrder.map(li => {
              const cfg = LAYER_CONFIG[li]
              const dim = layerDims[li]
              const vals = values[li]
              const spin = spinConfigs[li]
              const angle = ringAngles[li]

              // Combine user drag angle with spin animation
              const groupStyle = isSpinning
                ? {
                    animation: `pSpin${li} ${spin.dur}s ease-in-out`,
                    transformOrigin: `${CENTER}px ${CENTER}px`
                  }
                : undefined

              return (
                <g key={li}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab', ...groupStyle }}
                  onPointerDown={(e) => startRotate(e, li)}>

                  {/* Rotatable content group */}
                  <g transform={`rotate(${angle} ${CENTER} ${CENTER})`}>
                    {/* Segments with text */}
                    {Array.from({ length: SEGMENTS }).map((_, si) => {
                      const sa = si * segAngle
                      const ea = sa + segAngle
                      const midAngleRad = (sa + segAngle / 2 - 90) * Math.PI / 180
                      const midR = dim.innerR > 0
                        ? (dim.outerR + dim.innerR) / 2
                        : dim.outerR * 0.75
                      const tx = CENTER + midR * Math.cos(midAngleRad)
                      const ty = CENTER + midR * Math.sin(midAngleRad)
                      const text = vals[si] || ''
                      const fs = text.length > 15 ? cfg.baseFontSize * 0.8 : cfg.baseFontSize

                      return (
                        <g key={si}>
                          <path d={segmentPath(dim.outerR, dim.innerR, sa, ea)}
                            fill={cfg.color} stroke="#000" strokeWidth="3" />
                          {renderText(text, tx, ty, fs, si)}
                        </g>
                      )
                    })}

                    {/* Radial borders */}
                    {Array.from({ length: SEGMENTS }).map((_, si) => {
                      const a = (si * segAngle - 90) * Math.PI / 180
                      return (
                        <line key={si}
                          x1={dim.innerR > 0 ? CENTER + dim.innerR * Math.cos(a) : CENTER}
                          y1={dim.innerR > 0 ? CENTER + dim.innerR * Math.sin(a) : CENTER}
                          x2={CENTER + dim.outerR * Math.cos(a)}
                          y2={CENTER + dim.outerR * Math.sin(a)}
                          stroke="#000" strokeWidth="3.5" pointerEvents="none" />
                      )
                    })}
                  </g>

                  {/* Circular borders (don't rotate) */}
                  <circle cx={CENTER} cy={CENTER} r={dim.outerR}
                    fill="none" stroke="#000" strokeWidth="3.5" pointerEvents="none" />
                  {dim.innerR > 0 && (
                    <circle cx={CENTER} cy={CENTER} r={dim.innerR}
                      fill="none" stroke="#000" strokeWidth="3.5" pointerEvents="none" />
                  )}
                </g>
              )
            })}

            {/* Overlay when no mode selected */}
            {!mode && (
              <>
                <circle cx={CENTER} cy={CENTER} r={accR}
                  fill="rgba(0,0,0,0.45)" style={{ pointerEvents: 'none' }} />
                <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="28" fontWeight="bold"
                  style={{ pointerEvents: 'none' }}>
                  Select Mode
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Rotate Button */}
        <button onClick={rotate} disabled={!mode || isSpinning}
          className={`px-8 py-4 text-white text-xl font-bold rounded-full transition-all transform shadow-lg ${
            !mode || isSpinning
              ? 'bg-gray-500/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 hover:scale-105 active:scale-95'
          }`}>
          {isSpinning ? 'Spinning...' : !mode ? 'Select Mode' : 'Rotate'}
        </button>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4">
          {LAYER_CONFIG.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-white/30"
                style={{ backgroundColor: l.color }} />
              <span className="text-sm text-blue-200">{l.name}</span>
            </div>
          ))}
        </div>

        <p className="text-blue-200/50 text-xs">
          Read from center outward: Subject &rarr; Auxiliary Verb &rarr; Past Participle &rarr; Agent
        </p>
      </div>
    </div>
  )
}

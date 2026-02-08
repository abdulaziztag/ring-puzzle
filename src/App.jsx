import { useState, useRef } from 'react'

export default function App() {
  const SIZE = 600
  const CENTER = SIZE / 2

  // Customizable settings
  const [ringCount, setRingCount] = useState(5)
  const [segmentsPerRing, setSegmentsPerRing] = useState(3)
  const centerSegments = segmentsPerRing * 2 // Sun ray divisions (double the segments)

  // Initialize cells data (ringIndex, segmentIndex, content, styling)
  const initializeCells = (rings, segments) => {
    const cells = []
    // Regular rings
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        cells.push({
          ringIndex: r,
          segmentIndex: s,
          text: `R${r + 1}C${s + 1}`,
          bgColor: '#ffffff',
          textColor: '#000000',
          fontSize: 16
        })
      }
    }
    // Center circle
    for (let s = 0; s < centerSegments; s++) {
      cells.push({
        ringIndex: 'center',
        segmentIndex: s,
        text: `C${s + 1}`,
        bgColor: '#ffeb3b',
        textColor: '#000000',
        fontSize: 14
      })
    }
    return cells
  }

  const [cells, setCells] = useState(() => initializeCells(5, 3))
  const [rings, setRings] = useState(() =>
    Array.from({ length: 5 }, () => ({ angle: 0 }))
  )
  const [centerAngle, setCenterAngle] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const svgRef = useRef(null)

  // Shuffle rings to random positions
  const shuffle = () => {
    setRings(
      Array.from({ length: ringCount }, () => ({
        angle: Math.floor(Math.random() * 24) * 15 // Random angle in 15° increments
      }))
    )
    setCenterAngle(Math.floor(Math.random() * 24) * 15)
  }

  // Update ring count and reset puzzle
  const updateRingCount = (newCount) => {
    const clamped = Math.max(2, Math.min(8, newCount))
    setRingCount(clamped)
    setRings(Array.from({ length: clamped }, () => ({ angle: 0 })))
    setCenterAngle(0)
    setCells(initializeCells(clamped, segmentsPerRing))
  }

  // Update segments per ring and reset puzzle
  const updateSegmentsPerRing = (newSegments) => {
    const clamped = Math.max(2, Math.min(12, newSegments))
    setSegmentsPerRing(clamped)
    setRings(Array.from({ length: ringCount }, () => ({ angle: 0 })))
    setCenterAngle(0)
    setCells(initializeCells(ringCount, clamped))
  }

  // Update cell content
  const updateCell = (ringIndex, segmentIndex, updates) => {
    setCells(prev => prev.map(cell => {
      if (cell.ringIndex === ringIndex && cell.segmentIndex === segmentIndex) {
        return { ...cell, ...updates }
      }
      return cell
    }))
  }

  // Get cell data
  const getCell = (ringIndex, segmentIndex) => {
    return cells.find(cell =>
      cell.ringIndex === ringIndex && cell.segmentIndex === segmentIndex
    )
  }


  // Start rotating a ring - free rotation
  const startRotate = (e, ringIndex) => {
    e.preventDefault()
    setIsDragging(true)

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    const initialRingAngle = rings[ringIndex].angle

    const onMove = (moveEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI)
      const delta = currentAngle - startAngle

      setRings(prev => {
        const updated = [...prev]
        updated[ringIndex] = {
          angle: ((initialRingAngle + delta) % 360 + 360) % 360
        }
        return updated
      })
    }

    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      // Free rotation - no snapping
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Start rotating center circle - COMPLETELY FREE, NO MAGNETIC SNAP
  const startRotateCenter = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    const initialCenterAngle = centerAngle

    const onMove = (moveEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI)
      const delta = currentAngle - startAngle
      const newAngle = ((initialCenterAngle + delta) % 360 + 360) % 360
      setCenterAngle(newAngle)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setIsDragging(false)
      // IMPORTANT: NO SNAPPING APPLIED TO CENTER
      // It stays at whatever angle it was when released
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Calculate ring dimensions
  const maxRadius = SIZE * 0.45
  const ringThickness = maxRadius / ringCount
  const centerRadius = maxRadius - (ringCount * ringThickness)

  // Helper function to create a ring segment clip path
  const createSegmentPath = (outerR, innerR, startAngle, endAngle) => {
    const startRad = (startAngle - 90) * Math.PI / 180
    const endRad = (endAngle - 90) * Math.PI / 180

    const x1 = CENTER + outerR * Math.cos(startRad)
    const y1 = CENTER + outerR * Math.sin(startRad)
    const x2 = CENTER + outerR * Math.cos(endRad)
    const y2 = CENTER + outerR * Math.sin(endRad)
    const x3 = CENTER + innerR * Math.cos(endRad)
    const y3 = CENTER + innerR * Math.sin(endRad)
    const x4 = CENTER + innerR * Math.cos(startRad)
    const y4 = CENTER + innerR * Math.sin(startRad)

    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `
  }

  // Helper function to create center segment clip path (pie slice)
  const createCenterSegmentPath = (radius, startAngle, endAngle) => {
    const startRad = (startAngle - 90) * Math.PI / 180
    const endRad = (endAngle - 90) * Math.PI / 180

    const x1 = CENTER + radius * Math.cos(startRad)
    const y1 = CENTER + radius * Math.sin(startRad)
    const x2 = CENTER + radius * Math.cos(endRad)
    const y2 = CENTER + radius * Math.sin(endRad)

    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `
      M ${CENTER} ${CENTER}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">Grammar builder</h1>
          <p className="text-blue-200">Rotate the rings to restore the image</p>
        </div>

        {/* Game Board */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={SIZE}
            height={SIZE}
            className="drop-shadow-2xl"
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          >
            <defs>
              {/* Create clip paths for each ring segment */}
              {rings.map((_, ringIndex) => {
                const outerRadius = maxRadius - (ringIndex * ringThickness)
                const innerRadius = outerRadius - ringThickness
                const segmentAngle = 360 / segmentsPerRing

                return Array.from({ length: segmentsPerRing }).map((_, segIndex) => {
                  const startAngle = segIndex * segmentAngle
                  const endAngle = (segIndex + 1) * segmentAngle

                  return (
                    <clipPath key={`${ringIndex}-${segIndex}`} id={`ring-${ringIndex}-seg-${segIndex}`}>
                      <path d={createSegmentPath(outerRadius, innerRadius, startAngle, endAngle)} />
                    </clipPath>
                  )
                })
              })}

              {/* Create clip paths for center circle segments (sun rays) */}
              {Array.from({ length: centerSegments }).map((_, segIndex) => {
                const segmentAngle = 360 / centerSegments
                const startAngle = segIndex * segmentAngle
                const endAngle = (segIndex + 1) * segmentAngle

                return (
                  <clipPath key={`center-${segIndex}`} id={`center-seg-${segIndex}`}>
                    <path d={createCenterSegmentPath(centerRadius, startAngle, endAngle)} />
                  </clipPath>
                )
              })}
            </defs>

            {/* Background */}
            <rect width={SIZE} height={SIZE} fill="#1a1a2e" rx="20" />

            {/* Render each ring with segments */}
            {rings.map((ring, ringIndex) => {
              const outerRadius = maxRadius - (ringIndex * ringThickness)
              const innerRadius = outerRadius - ringThickness
              const segmentAngle = 360 / segmentsPerRing

              // Border thickness increases for inner rings (geometric progression)
              const borderThickness = 2 + (ringCount - ringIndex - 1) * 0.5

              return (
                <g
                  key={ringIndex}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  onPointerDown={(e) => startRotate(e, ringIndex)}
                >
                  {/* Render each segment of the ring */}
                  {Array.from({ length: segmentsPerRing }).map((_, segIndex) => {
                    const cellData = getCell(ringIndex, segIndex)
                    if (!cellData) return null

                    const segmentAngle = 360 / segmentsPerRing
                    const midAngle = (segIndex * segmentAngle + segmentAngle / 2 - 90) * Math.PI / 180
                    const midRadius = (outerRadius + innerRadius) / 2
                    const textX = CENTER + midRadius * Math.cos(midAngle)
                    const textY = CENTER + midRadius * Math.sin(midAngle)

                    return (
                      <g
                        key={segIndex}
                        transform={`rotate(${ring.angle} ${CENTER} ${CENTER})`}
                        clipPath={`url(#ring-${ringIndex}-seg-${segIndex})`}
                        onClick={() => setSelectedCell({ ringIndex, segmentIndex: segIndex })}
                      >
                        {/* Cell background */}
                        <path
                          d={createSegmentPath(outerRadius, innerRadius, segIndex * segmentAngle, (segIndex + 1) * segmentAngle)}
                          fill={cellData.bgColor}
                        />
                        {/* Cell text */}
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={cellData.textColor}
                          fontSize={cellData.fontSize}
                          fontWeight="bold"
                          transform={`rotate(${segIndex * segmentAngle + segmentAngle / 2} ${textX} ${textY})`}
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {cellData.text}
                        </text>
                      </g>
                    )
                  })}

                  {/* Segment borders (radial lines) - rotates with ring */}
                  <g transform={`rotate(${ring.angle} ${CENTER} ${CENTER})`}>
                    {Array.from({ length: segmentsPerRing }).map((_, segIndex) => {
                      const angle = (segIndex * segmentAngle - 90) * Math.PI / 180
                      const x1 = CENTER + innerRadius * Math.cos(angle)
                      const y1 = CENTER + innerRadius * Math.sin(angle)
                      const x2 = CENTER + outerRadius * Math.cos(angle)
                      const y2 = CENTER + outerRadius * Math.sin(angle)

                      return (
                        <line
                          key={segIndex}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(0, 0, 0, 0.8)"
                          strokeWidth={borderThickness}
                          pointerEvents="none"
                        />
                      )
                    })}
                  </g>

                  {/* Ring outer border */}
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={outerRadius}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.6)"
                    strokeWidth="2"
                    pointerEvents="none"
                  />

                  {/* Ring inner border */}
                  {ringIndex < ringCount - 1 && (
                    <circle
                      cx={CENTER}
                      cy={CENTER}
                      r={innerRadius}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.6)"
                      strokeWidth="2"
                      pointerEvents="none"
                    />
                  )}
                </g>
              )
            })}

            {/* Center circle with sun ray divisions */}
            {centerRadius > 0 && (
              <g
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  pointerEvents: 'all'
                }}
                onPointerDown={(e) => {
                  // Force use center rotation handler only
                  startRotateCenter(e)
                }}
              >
                {/* Render each segment of center circle */}
                {Array.from({ length: centerSegments }).map((_, segIndex) => {
                  const cellData = getCell('center', segIndex)
                  if (!cellData) return null

                  const segmentAngle = 360 / centerSegments
                  const midAngle = (segIndex * segmentAngle + segmentAngle / 2 - 90) * Math.PI / 180
                  const midRadius = centerRadius / 2
                  const textX = CENTER + midRadius * Math.cos(midAngle)
                  const textY = CENTER + midRadius * Math.sin(midAngle)

                  return (
                    <g
                      key={segIndex}
                      transform={`rotate(${centerAngle} ${CENTER} ${CENTER})`}
                      clipPath={`url(#center-seg-${segIndex})`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCell({ ringIndex: 'center', segmentIndex: segIndex })
                      }}
                    >
                      {/* Cell background */}
                      <path
                        d={createCenterSegmentPath(centerRadius, segIndex * segmentAngle, (segIndex + 1) * segmentAngle)}
                        fill={cellData.bgColor}
                        style={{ pointerEvents: 'none' }}
                      />
                      {/* Cell text */}
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={cellData.textColor}
                        fontSize={cellData.fontSize}
                        fontWeight="bold"
                        transform={`rotate(${segIndex * segmentAngle + segmentAngle / 2} ${textX} ${textY})`}
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {cellData.text}
                      </text>
                    </g>
                  )
                })}

                {/* Sun ray borders from center */}
                <g
                  transform={`rotate(${centerAngle} ${CENTER} ${CENTER})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {Array.from({ length: centerSegments }).map((_, segIndex) => {
                    const segmentAngle = 360 / centerSegments
                    const angle = (segIndex * segmentAngle - 90) * Math.PI / 180
                    const x = CENTER + centerRadius * Math.cos(angle)
                    const y = CENTER + centerRadius * Math.sin(angle)

                    return (
                      <line
                        key={segIndex}
                        x1={CENTER}
                        y1={CENTER}
                        x2={x}
                        y2={y}
                        stroke="rgba(0, 0, 0, 0.8)"
                        strokeWidth="3"
                        pointerEvents="none"
                      />
                    )
                  })}
                </g>

                {/* Center circle outer border */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={centerRadius}
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.8)"
                  strokeWidth="3"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )}
          </svg>

        </div>

        {/* Controls */}
        <button
          onClick={shuffle}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl font-bold rounded-full hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Shuffle
        </button>

        {/* Settings Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 text-center">Puzzle Settings</h2>

          <div className="space-y-6">
            {/* Ring Count Slider */}
            <div>
              <label className="flex items-center justify-between text-white mb-2">
                <span className="font-semibold">Number of Rings</span>
                <span className="bg-purple-500 px-3 py-1 rounded-full text-sm font-bold">{ringCount}</span>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={ringCount}
                onChange={(e) => updateRingCount(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-blue-200 mt-1">
                <span>2</span>
                <span>8</span>
              </div>
            </div>

            {/* Segments Per Ring Slider */}
            <div>
              <label className="flex items-center justify-between text-white mb-2">
                <span className="font-semibold">Segments per Ring</span>
                <span className="bg-pink-500 px-3 py-1 rounded-full text-sm font-bold">{segmentsPerRing}</span>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={segmentsPerRing}
                onChange={(e) => updateSegmentsPerRing(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-xs text-blue-200 mt-1">
                <span>2</span>
                <span>12</span>
              </div>
            </div>

            {/* Info text */}
            <div className="text-center text-xs text-blue-200 pt-2">
              <p>Center has {centerSegments} sun ray divisions</p>
            </div>
          </div>
        </div>

        {/* Cell Editor Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-4xl border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 text-center">Cell Content Editor</h2>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Regular ring cells */}
            {Array.from({ length: ringCount }).map((_, ringIndex) => (
              <div key={`ring-${ringIndex}`} className="space-y-2">
                <h3 className="text-sm font-bold text-pink-300 sticky top-0 bg-purple-900/80 backdrop-blur-sm px-2 py-1 rounded">
                  Ring {ringIndex + 1}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                  {Array.from({ length: segmentsPerRing }).map((_, segIndex) => {
                    const cellData = getCell(ringIndex, segIndex)
                    if (!cellData) return null

                    return (
                      <div
                        key={`cell-${ringIndex}-${segIndex}`}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-blue-200">
                            Cell {segIndex + 1}
                          </span>
                        </div>

                        {/* Text Input */}
                        <input
                          type="text"
                          value={cellData.text}
                          onChange={(e) => updateCell(ringIndex, segIndex, { text: e.target.value })}
                          placeholder="Cell text"
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <div className="grid grid-cols-3 gap-2">
                          {/* Background Color */}
                          <div>
                            <label className="text-xs text-blue-200 block mb-1">BG</label>
                            <input
                              type="color"
                              value={cellData.bgColor}
                              onChange={(e) => updateCell(ringIndex, segIndex, { bgColor: e.target.value })}
                              className="w-full h-8 rounded cursor-pointer"
                            />
                          </div>

                          {/* Text Color */}
                          <div>
                            <label className="text-xs text-blue-200 block mb-1">Text</label>
                            <input
                              type="color"
                              value={cellData.textColor}
                              onChange={(e) => updateCell(ringIndex, segIndex, { textColor: e.target.value })}
                              className="w-full h-8 rounded cursor-pointer"
                            />
                          </div>

                          {/* Font Size */}
                          <div>
                            <label className="text-xs text-blue-200 block mb-1">Size</label>
                            <input
                              type="number"
                              value={cellData.fontSize}
                              onChange={(e) => updateCell(ringIndex, segIndex, { fontSize: Number(e.target.value) })}
                              min="8"
                              max="48"
                              className="w-full h-8 px-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Center circle cells */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-yellow-300 sticky top-0 bg-purple-900/80 backdrop-blur-sm px-2 py-1 rounded">
                Center Circle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {Array.from({ length: centerSegments }).map((_, segIndex) => {
                  const cellData = getCell('center', segIndex)
                  if (!cellData) return null

                  return (
                    <div
                      key={`cell-center-${segIndex}`}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-200">
                          Center {segIndex + 1}
                        </span>
                      </div>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={cellData.text}
                        onChange={(e) => updateCell('center', segIndex, { text: e.target.value })}
                        placeholder="Cell text"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        {/* Background Color */}
                        <div>
                          <label className="text-xs text-blue-200 block mb-1">BG</label>
                          <input
                            type="color"
                            value={cellData.bgColor}
                            onChange={(e) => updateCell('center', segIndex, { bgColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="text-xs text-blue-200 block mb-1">Text</label>
                          <input
                            type="color"
                            value={cellData.textColor}
                            onChange={(e) => updateCell('center', segIndex, { textColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="text-xs text-blue-200 block mb-1">Size</label>
                          <input
                            type="number"
                            value={cellData.fontSize}
                            onChange={(e) => updateCell('center', segIndex, { fontSize: Number(e.target.value) })}
                            min="8"
                            max="48"
                            className="w-full h-8 px-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-blue-200 text-sm max-w-md">
          <p>Click and drag any ring to rotate it.</p>
          <p>Edit cell content, colors, and sizes above!</p>
        </div>
      </div>
    </div>
  )
}

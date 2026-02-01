import { useState, useRef } from 'react'
import './App.css'

const COLORS = [
  { name: 'yellow', value: '#f9df6d' },
  { name: 'green', value: '#a0c35a' },
  { name: 'blue', value: '#b0c4ef' },
  { name: 'purple', value: '#ba81c5' },
]

type ColorName = 'yellow' | 'green' | 'blue' | 'purple' | null

interface TileData {
  word: string
  color: ColorName
  offset: { x: number; y: number }
}

// Mock data - TODO: fetch from NYT API
const MOCK_WORDS = [
  'MARS', 'SNICKERS', 'TWIX', 'BOUNTY',
  'VENUS', 'MERCURY', 'SATURN', 'JUPITER',
  'FREDDIE', 'BRIAN', 'ROGER', 'JOHN',
  'BREAK', 'KIT', 'KAT', 'BAR',
]

function App() {
  const [tiles, setTiles] = useState<TileData[]>(
    MOCK_WORDS.map((word) => ({ word, color: null, offset: { x: 0, y: 0 } }))
  )
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY }
    }
    return { x: 0, y: 0 }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    const pos = getClientPos(e)
    dragStart.current = { x: pos.x, y: pos.y }
    startOffset.current = { ...tiles[index].offset }
    setDraggingIndex(index)
    isDragging.current = false
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIndex === null) return

    const pos = getClientPos(e)
    const dx = pos.x - dragStart.current.x
    const dy = pos.y - dragStart.current.y

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true
    }

    setTiles((prev) =>
      prev.map((tile, i) =>
        i === draggingIndex
          ? {
              ...tile,
              offset: {
                x: startOffset.current.x + dx,
                y: startOffset.current.y + dy,
              },
            }
          : tile
      )
    )
  }

  const handleDragEnd = (index?: number) => {
    if (draggingIndex !== null) {
      // If it was a click (not a drag), toggle selection
      if (!isDragging.current && index !== undefined) {
        setSelectedIndex(index === selectedIndex ? null : index)
      }
    }
    setDraggingIndex(null)
  }

  const handleColorSelect = (color: ColorName) => {
    if (selectedIndex === null) return

    setTiles((prev) =>
      prev.map((tile, i) =>
        i === selectedIndex
          ? { ...tile, color: tile.color === color ? null : color }
          : tile
      )
    )
    setSelectedIndex(null)
  }

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return '#efefe6'
    return COLORS.find((c) => c.name === tile.color)?.value || '#efefe6'
  }

  return (
    <div
      className="game"
      onMouseMove={handleDragMove}
      onMouseUp={() => handleDragEnd()}
      onMouseLeave={() => handleDragEnd()}
      onTouchMove={handleDragMove}
      onTouchEnd={() => handleDragEnd()}
    >
      <h1>Connections</h1>
      <div className="grid" onClick={() => setSelectedIndex(null)}>
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-wrapper">
            <button
              className={`tile ${draggingIndex === index ? 'dragging' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              style={{
                backgroundColor: getBackgroundColor(tile),
                transform: `translate(${tile.offset.x}px, ${tile.offset.y}px)${draggingIndex === index ? ' scale(1.05)' : ''}`,
                zIndex: draggingIndex === index ? 10 : 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                handleDragStart(e, index)
              }}
              onMouseUp={() => handleDragEnd(index)}
              onTouchStart={(e) => handleDragStart(e, index)}
              onTouchEnd={() => handleDragEnd(index)}
            >
              {tile.word}
            </button>

            {selectedIndex === index && (
              <div
                className="color-popup"
                style={{
                  transform: `translate(${tile.offset.x}px, ${tile.offset.y}px)`,
                }}
              >
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`color-option ${tile.color === color.name ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleColorSelect(color.name as ColorName)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App

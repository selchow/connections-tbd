import { useState, useRef, useEffect } from 'react'
import './App.css'

const GAP = 8

const COLORS = [
  { name: 'yellow', value: '#f9df6d' },
  { name: 'green', value: '#a0c35a' },
  { name: 'blue', value: '#b0c4ef' },
  { name: 'purple', value: '#ba81c5' },
]

type ColorName = 'yellow' | 'green' | 'blue' | 'purple' | null

interface TileData {
  word: string
  x: number
  y: number
  color: ColorName
}

interface ConnectionsCategory {
  title: string
  cards: { content: string; position: number }[]
}

interface ConnectionsResponse {
  categories: ConnectionsCategory[]
}

function getTodayDate(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

function App() {
  const [tiles, setTiles] = useState<TileData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tileSize, setTileSize] = useState({ width: 80, height: 50 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  // Calculate tile size based on canvas width
  useEffect(() => {
    function updateTileSize() {
      if (canvasRef.current) {
        const canvasWidth = canvasRef.current.offsetWidth
        const tileWidth = (canvasWidth - GAP * 3) / 4
        const tileHeight = tileWidth * 0.6
        setTileSize({ width: tileWidth, height: tileHeight })
      }
    }

    updateTileSize()
    window.addEventListener('resize', updateTileSize)
    return () => window.removeEventListener('resize', updateTileSize)
  }, [])

  // Update tile positions when tile size changes
  useEffect(() => {
    setTiles((prev) => {
      if (prev.length === 0) return prev
      return prev.map((tile, index) => ({
        ...tile,
        x: (index % 4) * (tileSize.width + GAP),
        y: Math.floor(index / 4) * (tileSize.height + GAP),
      }))
    })
  }, [tileSize])

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        const date = getTodayDate()
        const apiUrl = `https://www.nytimes.com/svc/connections/v2/${date}.json`
        const response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch puzzle')
        }
        const data: ConnectionsResponse = await response.json()

        const allCards = data.categories.flatMap((cat) => cat.cards)
        allCards.sort((a, b) => a.position - b.position)
        const words = allCards.map((card) => card.content)
        setTiles(
          words.map((word, index) => ({
            word,
            x: (index % 4) * (tileSize.width + GAP),
            y: Math.floor(index / 4) * (tileSize.height + GAP),
            color: null,
          }))
        )
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchPuzzle()
  }, [tileSize])

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const getCanvasOffset = () => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    const tile = tiles[index]
    const clientPos = getClientPos(e)
    const canvasOffset = getCanvasOffset()
    dragOffset.current = {
      x: clientPos.x - canvasOffset.x - tile.x,
      y: clientPos.y - canvasOffset.y - tile.y,
    }
    setDraggingIndex(index)
    isDragging.current = false
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIndex === null) return

    isDragging.current = true
    const clientPos = getClientPos(e)
    const canvasOffset = getCanvasOffset()

    const newTiles = [...tiles]
    newTiles[draggingIndex] = {
      ...newTiles[draggingIndex],
      x: clientPos.x - canvasOffset.x - dragOffset.current.x,
      y: clientPos.y - canvasOffset.y - dragOffset.current.y,
    }
    setTiles(newTiles)
  }

  const handleDragEnd = (index?: number) => {
    if (draggingIndex !== null && !isDragging.current && index !== undefined) {
      setSelectedIndex(index === selectedIndex ? null : index)
    }
    setDraggingIndex(null)
  }

  const handleColorSelect = (color: ColorName) => {
    if (selectedIndex === null) return

    const newTiles = [...tiles]
    newTiles[selectedIndex] = {
      ...newTiles[selectedIndex],
      color: newTiles[selectedIndex].color === color ? null : color,
    }
    setTiles(newTiles)
    setSelectedIndex(null)
  }

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIndex(null)
    }
  }

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return '#efefe6'
    return COLORS.find((c) => c.name === tile.color)?.value || '#efefe6'
  }

  if (loading) {
    return (
      <div className="game">
        <h1>Connections</h1>
        <p>Loading today's puzzle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game">
        <h1>Connections</h1>
        <p className="error">Error: {error}</p>
      </div>
    )
  }

  const canvasHeight = tileSize.height * 4 + GAP * 3

  return (
    <div
      className="game"
      onMouseMove={handleDragMove}
      onMouseUp={() => handleDragEnd()}
      onMouseLeave={() => setDraggingIndex(null)}
      onTouchMove={handleDragMove}
      onTouchEnd={() => handleDragEnd()}
    >
      <h1>Connections</h1>
      <div
        className="canvas"
        ref={canvasRef}
        style={{ height: canvasHeight }}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      >
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-container">
            <button
              className={`tile ${draggingIndex === index ? 'dragging' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              style={{
                left: tile.x,
                top: tile.y,
                width: tileSize.width,
                height: tileSize.height,
                zIndex: draggingIndex === index ? 10 : 1,
                backgroundColor: getBackgroundColor(tile),
                fontSize: tileSize.width < 100 ? '0.7rem' : '0.9rem',
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
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
                  left: tile.x + tileSize.width / 2,
                  top: tile.y + tileSize.height + 8,
                }}
              >
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`color-option ${tile.color === color.name ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorSelect(color.name as ColorName)}
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

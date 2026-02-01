import { useState, useRef, useEffect } from 'react'
import './App.css'

const TILE_WIDTH = 130
const TILE_HEIGHT = 80
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


function createTiles(words: string[]): TileData[] {
  return words.map((word, index) => ({
    word,
    x: (index % 4) * (TILE_WIDTH + GAP),
    y: Math.floor(index / 4) * (TILE_HEIGHT + GAP),
    color: null,
  }))
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
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        const date = getTodayDate()
        const apiUrl = `https://www.nytimes.com/svc/connections/v2/${date}.json`
        const response = await fetch(
          `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch puzzle')
        }
        const data: ConnectionsResponse = await response.json()

        // Flatten all cards and sort by position to match game order
        const allCards = data.categories.flatMap((cat) => cat.cards)
        allCards.sort((a, b) => a.position - b.position)
        const words = allCards.map((card) => card.content)
        setTiles(createTiles(words))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchPuzzle()
  }, [])

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    const tile = tiles[index]
    dragOffset.current = {
      x: e.clientX - tile.x,
      y: e.clientY - tile.y,
    }
    setDraggingIndex(index)
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIndex === null) return

    isDragging.current = true
    const newTiles = [...tiles]
    newTiles[draggingIndex] = {
      ...newTiles[draggingIndex],
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    }
    setTiles(newTiles)
  }

  const handleMouseUp = (index?: number) => {
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

  const handleCanvasClick = (e: React.MouseEvent) => {
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

  return (
    <div
      className="game"
      onMouseMove={handleMouseMove}
      onMouseUp={() => handleMouseUp()}
      onMouseLeave={() => setDraggingIndex(null)}
    >
      <h1>Connections</h1>
      <div className="canvas" onClick={handleCanvasClick}>
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-container">
            <button
              className={`tile ${draggingIndex === index ? 'dragging' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              style={{
                left: tile.x,
                top: tile.y,
                zIndex: draggingIndex === index ? 10 : 1,
                backgroundColor: getBackgroundColor(tile),
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
              onMouseUp={() => handleMouseUp(index)}
            >
              {tile.word}
            </button>

            {selectedIndex === index && (
              <div
                className="color-popup"
                style={{
                  left: tile.x + TILE_WIDTH / 2,
                  top: tile.y + TILE_HEIGHT + 8,
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

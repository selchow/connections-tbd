import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [words, setWords] = useState<string[]>([])
  const [tiles, setTiles] = useState<TileData[]>([])
  const [tileSize, setTileSize] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const createTiles = useCallback((wordList: string[], size: number): TileData[] => {
    return wordList.map((word, index) => ({
      word,
      x: (index % 4) * (size + GAP),
      y: Math.floor(index / 4) * (size + GAP),
      color: null,
    }))
  }, [])

  // Calculate tile size based on canvas width
  const updateTileSize = useCallback(() => {
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.offsetWidth
      const newTileSize = (canvasWidth - GAP * 3) / 4
      setTileSize(newTileSize)
      return newTileSize
    }
    return tileSize
  }, [tileSize])

  // Update tile positions when size changes
  useEffect(() => {
    if (words.length > 0) {
      setTiles(prev => {
        // Preserve colors when repositioning
        const colors = new Map(prev.map(t => [t.word, t.color]))
        return words.map((word, index) => ({
          word,
          x: (index % 4) * (tileSize + GAP),
          y: Math.floor(index / 4) * (tileSize + GAP),
          color: colors.get(word) || null,
        }))
      })
    }
  }, [tileSize, words])

  // Handle resize
  useEffect(() => {
    const handleResize = () => updateTileSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateTileSize])

  // Initial size calculation after mount
  useEffect(() => {
    updateTileSize()
  }, [updateTileSize])

  // Fetch puzzle
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
        const wordList = allCards.map((card) => card.content)
        setWords(wordList)

        // Calculate initial tile size and create tiles
        const size = updateTileSize()
        setTiles(createTiles(wordList, size))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchPuzzle()
  }, [createTiles, updateTileSize])

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
    const tile = tiles[index]
    const pos = getClientPos(e)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    dragOffset.current = {
      x: pos.x - (canvasRect?.left || 0) - tile.x,
      y: pos.y - (canvasRect?.top || 0) - tile.y,
    }
    setDraggingIndex(index)
    isDragging.current = false
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIndex === null) return

    isDragging.current = true
    const pos = getClientPos(e)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const newTiles = [...tiles]
    newTiles[draggingIndex] = {
      ...newTiles[draggingIndex],
      x: pos.x - (canvasRect?.left || 0) - dragOffset.current.x,
      y: pos.y - (canvasRect?.top || 0) - dragOffset.current.y,
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIndex(null)
    }
  }

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return '#efefe6'
    return COLORS.find((c) => c.name === tile.color)?.value || '#efefe6'
  }

  const canvasHeight = tileSize * 4 + GAP * 3

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
      >
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-container">
            <button
              className={`tile ${draggingIndex === index ? 'dragging' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              style={{
                left: tile.x,
                top: tile.y,
                width: tileSize,
                height: tileSize,
                zIndex: draggingIndex === index ? 10 : 1,
                backgroundColor: getBackgroundColor(tile),
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
                  left: tile.x + tileSize / 2,
                  top: tile.y + tileSize + 8,
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

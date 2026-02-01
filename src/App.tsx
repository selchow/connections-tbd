import { useState, useEffect } from 'react'
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
        setTiles(allCards.map((card) => ({ word: card.content, color: null })))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchPuzzle()
  }, [])

  const handleTileClick = (index: number) => {
    if (draggedIndex !== null) return
    setSelectedIndex(index === selectedIndex ? null : index)
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    setSelectedIndex(null)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    setTiles((prev) => {
      const newTiles = [...prev]
      const [draggedTile] = newTiles.splice(draggedIndex, 1)
      newTiles.splice(index, 0, draggedTile)
      return newTiles
    })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleTouchStart = (index: number) => {
    // On touch, just select for color picking
    setSelectedIndex(index === selectedIndex ? null : index)
  }

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return '#efefe6'
    return COLORS.find((c) => c.name === tile.color)?.value || '#efefe6'
  }

  if (loading) {
    return (
      <div className="game">
        <h1>Connections</h1>
        <p className="loading">Loading today's puzzle...</p>
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
    <div className="game" onClick={() => setSelectedIndex(null)}>
      <h1>Connections</h1>
      <div className="grid" onClick={(e) => e.stopPropagation()}>
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-wrapper">
            <button
              className={`tile ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              style={{ backgroundColor: getBackgroundColor(tile) }}
              draggable
              onClick={() => handleTileClick(index)}
              onTouchEnd={() => handleTouchStart(index)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {tile.word}
            </button>

            {selectedIndex === index && (
              <div className="color-popup">
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

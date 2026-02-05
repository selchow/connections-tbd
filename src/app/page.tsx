"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = [
  { name: "yellow", value: "#f9df6d" },
  { name: "green", value: "#a0c35a" },
  { name: "blue", value: "#b0c4ef" },
  { name: "purple", value: "#ba81c5" },
];

type ColorName = "yellow" | "green" | "blue" | "purple" | null;

interface TileData {
  word: string;
  color: ColorName;
  offset: { x: number; y: number };
}

interface PuzzleCategory {
  title: string;
  cards: { content: string; position: number }[];
}

interface PuzzleData {
  categories: PuzzleCategory[];
}

export default function Home() {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        const today = new Date();
        const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const response = await fetch(`/api/puzzle?date=${date}`);
        if (!response.ok) {
          throw new Error("Failed to fetch puzzle");
        }
        const data: PuzzleData = await response.json();

        const words = data.categories
          .flatMap((cat) => cat.cards.map((card) => card.content))
          .sort(() => Math.random() - 0.5);

        setTiles(
          words.map((word) => ({ word, color: null, offset: { x: 0, y: 0 } })),
        );
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }

    fetchPuzzle();
  }, []);

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  };

  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    index: number,
  ) => {
    const pos = getClientPos(e);
    dragStart.current = { x: pos.x, y: pos.y };
    startOffset.current = { ...tiles[index].offset };
    setDraggingIndex(index);
    isDragging.current = false;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIndex === null) return;

    const pos = getClientPos(e);
    const dx = pos.x - dragStart.current.x;
    const dy = pos.y - dragStart.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true;
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
          : tile,
      ),
    );
  };

  const handleDragEnd = (index?: number) => {
    if (draggingIndex !== null) {
      // If it was a click (not a drag), open the color picker
      if (!isDragging.current && index !== undefined) {
        setColorPickerIndex(index);
      }
    }
    setDraggingIndex(null);
  };

  const handleColorSelect = (color: ColorName) => {
    if (colorPickerIndex === null) return;

    setTiles((prev) =>
      prev.map((tile, i) =>
        i === colorPickerIndex
          ? { ...tile, color: tile.color === color ? null : color }
          : tile,
      ),
    );
    setColorPickerIndex(null);
  };

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return "#efefe6";
    return COLORS.find((c) => c.name === tile.color)?.value || "#efefe6";
  };

  if (loading) {
    return (
      <div className="game">
        <h1>Connections</h1>
        <p>Loading today&apos;s puzzle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game">
        <h1>Connections</h1>
        <p>Error: {error}</p>
      </div>
    );
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
      <div className="grid">
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-wrapper">
            <button
              className={`tile ${draggingIndex === index ? "dragging" : ""}`}
              style={{
                backgroundColor: getBackgroundColor(tile),
                transform: `translate(${tile.offset.x}px, ${tile.offset.y}px)${draggingIndex === index ? " scale(1.05)" : ""}`,
                zIndex: draggingIndex === index ? 10 : 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragStart(e, index);
              }}
              onMouseUp={() => handleDragEnd(index)}
              onTouchStart={(e) => handleDragStart(e, index)}
              onTouchEnd={() => handleDragEnd(index)}
            >
              {tile.word}
            </button>
          </div>
        ))}
      </div>

      <Dialog
        open={colorPickerIndex !== null}
        onOpenChange={(open) => !open && setColorPickerIndex(null)}
      >
        <DialogContent showCloseButton={false} className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {colorPickerIndex !== null && tiles[colorPickerIndex]?.word}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4">
            {COLORS.map((color) => (
              <button
                key={color.name}
                className={`color-option ${colorPickerIndex !== null && tiles[colorPickerIndex]?.color === color.name ? "active" : ""}`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.name as ColorName)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

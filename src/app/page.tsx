"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeGuesses, OneAwayGuess } from "@/lib/deduction";

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

  // One-away tracking
  const [oneAwayGuesses, setOneAwayGuesses] = useState<OneAwayGuess[]>([]);
  const [isSelectingOneAway, setIsSelectingOneAway] = useState(false);
  const [selectedForOneAway, setSelectedForOneAway] = useState<Set<string>>(
    new Set(),
  );

  const dragStart = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Compute analysis whenever guesses change
  const analysis = useMemo(() => {
    const allWords = tiles.map((t) => t.word);
    return analyzeGuesses(allWords, oneAwayGuesses);
  }, [tiles, oneAwayGuesses]);

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
          .flatMap((cat) => cat.cards)
          .sort((a, b) => a.position - b.position)
          .map((card) => card.content);

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
    // Don't start drag if we're in one-away selection mode
    if (isSelectingOneAway) return;

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

  const handleTileClick = (word: string) => {
    if (isSelectingOneAway) {
      setSelectedForOneAway((prev) => {
        const next = new Set(prev);
        if (next.has(word)) {
          next.delete(word);
        } else if (next.size < 4) {
          next.add(word);
        }
        return next;
      });
    }
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

  const handleConfirmOneAway = () => {
    if (selectedForOneAway.size === 4) {
      const words = [...selectedForOneAway] as [string, string, string, string];
      const newGuess: OneAwayGuess = {
        id: crypto.randomUUID(),
        words,
      };
      setOneAwayGuesses((prev) => [...prev, newGuess]);
      setSelectedForOneAway(new Set());
      setIsSelectingOneAway(false);
    }
  };

  const handleRemoveGuess = (id: string) => {
    setOneAwayGuesses((prev) => prev.filter((g) => g.id !== id));
  };

  const getBackgroundColor = (tile: TileData) => {
    if (!tile.color) return "#efefe6";
    return COLORS.find((c) => c.name === tile.color)?.value || "#efefe6";
  };

  const isWordInOneAway = (word: string) => {
    return oneAwayGuesses.some((g) => g.words.includes(word));
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

      {/* One-away mode banner */}
      {isSelectingOneAway && (
        <div className="mb-4 p-3 bg-amber-900/50 rounded-lg border border-amber-500">
          <p className="text-amber-200 text-sm mb-2">
            Select the 4 words from your one-away guess
          </p>
          <p className="text-amber-300 font-bold">
            {selectedForOneAway.size}/4 selected
          </p>
        </div>
      )}

      <div className="grid">
        {tiles.map((tile, index) => (
          <div key={tile.word} className="tile-wrapper">
            <button
              className={`tile ${draggingIndex === index ? "dragging" : ""} ${
                isSelectingOneAway && selectedForOneAway.has(tile.word)
                  ? "selected"
                  : ""
              }`}
              style={{
                backgroundColor: getBackgroundColor(tile),
                transform: `translate(${tile.offset.x}px, ${tile.offset.y}px)${draggingIndex === index ? " scale(1.05)" : ""}`,
                zIndex: draggingIndex === index ? 10 : 1,
                outline: isWordInOneAway(tile.word)
                  ? "2px dashed rgba(255,255,255,0.5)"
                  : undefined,
                outlineOffset: isWordInOneAway(tile.word) ? "-4px" : undefined,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (isSelectingOneAway) {
                  handleTileClick(tile.word);
                } else {
                  handleDragStart(e, index);
                }
              }}
              onMouseUp={() => {
                if (!isSelectingOneAway) {
                  handleDragEnd(index);
                }
              }}
              onClick={(e) => {
                if (isSelectingOneAway) {
                  e.stopPropagation();
                  handleTileClick(tile.word);
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (!isSelectingOneAway) {
                  handleDragStart(e, index);
                }
              }}
              onTouchEnd={() => {
                if (!isSelectingOneAway) {
                  handleDragEnd(index);
                }
              }}
            >
              {tile.word}
            </button>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2 justify-center flex-wrap">
        {!isSelectingOneAway ? (
          <Button
            variant="outline"
            onClick={() => setIsSelectingOneAway(true)}
            className="text-amber-400 border-amber-400 hover:bg-amber-400/10"
          >
            Log One-Away Guess
          </Button>
        ) : (
          <>
            <Button
              variant="default"
              onClick={handleConfirmOneAway}
              disabled={selectedForOneAway.size !== 4}
            >
              Confirm ({selectedForOneAway.size}/4)
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSelectingOneAway(false);
                setSelectedForOneAway(new Set());
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Logged guesses */}
      {oneAwayGuesses.length > 0 && (
        <Card className="mt-4 bg-zinc-900 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              One-Away Guesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {oneAwayGuesses.map((guess) => (
              <div
                key={guess.id}
                className="flex items-center justify-between gap-2 p-2 bg-zinc-800 rounded"
              >
                <div className="flex flex-wrap gap-1">
                  {guess.words.map((word) => (
                    <Badge key={word} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGuess(guess.id)}
                  className="text-zinc-500 hover:text-red-400 h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Deductions panel */}
      {analysis.insights.length > 0 && (
        <Card className="mt-4 bg-emerald-950 border-emerald-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400">
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.insights.map((insight, i) => (
              <p key={i} className="text-sm text-emerald-200">
                {insight}
              </p>
            ))}
            {analysis.possibleGroups.length > 0 &&
              analysis.possibleGroups.length <= 6 && (
                <div className="mt-3 pt-3 border-t border-emerald-800">
                  <p className="text-xs text-emerald-500 mb-2">
                    Possible groups:
                  </p>
                  {analysis.possibleGroups.map((group, i) => (
                    <div key={i} className="flex flex-wrap gap-1 mb-1">
                      {group.map((word) => (
                        <Badge
                          key={word}
                          variant="outline"
                          className="text-xs border-emerald-600 text-emerald-300"
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Color picker dialog */}
      <Dialog
        open={colorPickerIndex !== null && !isSelectingOneAway}
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
          <DialogFooter className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-zinc-400"
              onClick={() => {
                if (colorPickerIndex !== null) {
                  setTiles((prev) =>
                    prev.map((tile, i) =>
                      i === colorPickerIndex ? { ...tile, color: null } : tile,
                    ),
                  );
                }
                setColorPickerIndex(null);
              }}
            >
              Clear Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

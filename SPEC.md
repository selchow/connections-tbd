# Connections Helper

A mobile-first web app to help solve NYT Connections puzzles - not by cheating, but by helping you organize information and deduce possibilities from the clues the game gives you.

## Core Concept

NYT Connections gives you 16 words to sort into 4 groups of 4. When you guess wrong but get "one away," that's valuable information. This app helps you track and utilize that info.

## Features

### Phase 1: Organization Tool (Copilot Clone)
- Fetch the daily NYT Connections puzzle automatically
- Display 16 words in a draggable grid
- Color-code words by suspected category (purple, blue, green, yellow)
- Group words together visually
- Mark words as "confident" vs "uncertain"

### Phase 2: One-Away Deduction
- Log guesses that resulted in "one away"
- Deduction engine calculates which groupings are still possible
- Visual display of constraints (e.g., "3 of {A, B, C, D} are in the same group")
- Highlight contradictions or certainties

### Future (Maybe)
- Save/review past puzzles
- Stats tracking

## Technical Notes

- Mobile-first, responsive design
- Touch-friendly drag and drop
- React + TypeScript + Vite (already set up)

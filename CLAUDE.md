# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React web application built with Vite and TypeScript.

## Common Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server (http://localhost:5173)
npm run build      # TypeScript compile + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Architecture

Standard Vite + React + TypeScript structure:

- **src/** - Application source code
- **src/App.tsx** - Main application component
- **src/main.tsx** - Application entry point
- **public/** - Static assets (served as-is)

## Tech Stack

- React 18 with TypeScript
- Vite 5 for bundling and dev server
- ESLint 9 with React hooks and refresh plugins

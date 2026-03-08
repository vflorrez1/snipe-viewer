# CLAUDE.md

## Project Overview

Crypto Sniping Backtest Simulator — a React + TypeScript + Vite app for logging, importing, and analyzing crypto trades with an equity curve visualization.

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Recharts for equity curve charting
- No CSS framework — custom inline styles + App.css with dark theme
- Node >= 22 required (`nvm use 22`)

## Commands

- `npm run dev` — start dev server (localhost:5173)
- `npm run build` — type-check + production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Project Structure

```
src/
  types/trade.ts        — Trade, ImportResult, Stats, ValidationResult interfaces
  data/constants.ts     — Sample trades, trading pairs, sample JSON, empty form defaults
  utils/trade.ts        — validateTrade, normaliseTrade, isOpen, pnl, pct, fmt helpers
  components/
    Header.tsx          — App header with trade count and open positions badge
    StatsGrid.tsx       — 9-card stats dashboard (equity, P&L, win rate, drawdown, etc.)
    EquityCurve.tsx     — Recharts LineChart with custom tooltip
    TabBar.tsx          — Tab switcher (Trades / Import JSON / Add)
    TradesTable.tsx     — Sortable trades table with edit/delete actions
    JsonImport.tsx      — JSON paste/drag-drop import with schema docs and validation results
    TradeForm.tsx       — Add/edit trade form with live P&L preview
  App.tsx               — Root component, all state management lives here
  App.css               — Global styles (dark theme, scrollbar, form inputs, buttons)
  index.css             — Minimal body reset
```

## Architecture Notes

- All trade state is managed in App.tsx (no external state management)
- Trade validation happens in `utils/trade.ts` — errors block import, warnings (missing exit) allow import but mark as open
- `normaliseTrade` handles multiple field name conventions (entry/entryPrice/entry_price, side/direction, etc.)
- Open positions (no exit price) are excluded from P&L calculations and shown at reduced opacity
- Trades are deduplicated by ID on import
- Starting capital is hardcoded at $10,000

## Design System

- Background: `#080a0f`, cards: `#0f1117`, borders: `#1e2130`
- Green (profit/positive): `#00e5a0`
- Red (loss/negative): `#ff5470`
- Warning/open: `#ff9f43`
- Fonts: IBM Plex Mono (body), Syne (header)

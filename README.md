# Snipe Viewer

A crypto trade backtest simulator built with React, TypeScript, and Vite. Log, import, and analyze trades with an interactive equity curve visualization.

## Deployment

This app is deployed on Cloudflare Pages.

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 7
- Recharts (equity curve charting)

## Getting Started

```bash
nvm use 22
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:8080` |
| `VITE_API_KEY` | API key sent as `X-API-Key` header on all backend requests | `secret` |

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8080
VITE_API_KEY=your-api-key-here
```

The app will fall back to `"secret"` if the variable is not set.

## Scripts

- `npm run dev` — start dev server (localhost:5173)
- `npm run build` — type-check + production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

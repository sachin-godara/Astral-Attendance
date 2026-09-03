# Astral Attendance

A clean, minimalist black-and-white attendance tracker and predictive analytics calculator for students.

## Features

- **Single-Aggregate Tracking**: Simple, clutter-free tracking for aggregate attendance.
- **Configurable Academic Criteria**: Customize your target percentage (65%, 70%, 75%, 80%, 85%, or custom) and daily period counts.
- **What-If Bunk Sandbox**: Interactive simulation sliders to test the exact impact of future skipped or attended days without mutating saved data.
- **Dynamic Circular Gauge**: Real-time visualization with customizable target tick mark and 3-tier status badges (Comfortable, Borderline, Deficit).
- **Calendar-Aware Forecast**: 7-day predictive trajectory accounting for actual weekends, designated holidays, and extra working sessions.
- **Instructional Day Lookahead**: Smart next-class risk calculations skipping non-working days.
- **Data Privacy & Portability**: 100% client-side storage with localStorage persistence, undo/restore support, and JSON backup export and import.
- **Theme Support**: Seamless dark and light modes with system preference detection.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
```

### Previewing the Production Build
```bash
npm run preview
```

## Deploying to Netlify

This project is pre-configured for instant Netlify deployment:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Netlify configuration**: Handled automatically via `netlify.toml` with SPA redirects.

## License
MIT


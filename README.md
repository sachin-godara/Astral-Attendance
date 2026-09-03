<div align="center">

# Astral Attendance

**Minimalist Attendance Analytics & Predictive Academic Calculator**

A high-precision, privacy-first attendance intelligence tool built for students. Designed with a clean monochromatic aesthetic, instant deterministic mathematics, and zero clutter.

[![React 19](https://img.shields.io/badge/React-19-09090b?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-09090b?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-09090b?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-09090b?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-09090b?style=for-the-badge)](LICENSE)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25_Local-09090b?style=for-the-badge)](https://github.com/sachin-godara/Astral-Attendance)

[Live Demo](https://github.com/sachin-godara/Astral-Attendance) • [Features](#key-features) • [Mathematical Model](#mathematical-formulation) • [Getting Started](#getting-started) • [Deployment](#deploying-to-production)

</div>

---

## Overview

Most academic attendance trackers suffer from feature bloat—cumbersome multi-course grids, mandatory user logins, server dependencies, and intrusive ads. 

**Astral Attendance** takes the opposite approach: **single-aggregate clarity**. It is engineered as a focused dashboard that answers a student's most critical questions in under 3 seconds:

- *How many classes can I safely bunk right now while remaining above my target?*
- *If I am in deficit, exactly how many consecutive classes must I attend to recover?*
- *What is my exact attendance drop if I skip the next instructional day?*
- *Accounting for real holidays and extra sessions, will I qualify by exam day?*

All calculations run entirely in the browser with sub-millisecond execution, zero analytics tracking, and complete offline capability.

---

## Key Features

### ⚙️ Configurable Academic Criteria
- **Custom Target Thresholds**: Select common targets (`65%`, `70%`, `75%`, `80%`, `85%`) or input any custom threshold between `1%` and `100%`.
- **Dynamic Period Density**: Set standard daily class loads (`4`, `5`, `6`, `7`, `8`, or custom) to reflect your institution's schedule.
- **Dynamic Gauge Tick**: The circular progress ring dynamically renders a calibrated tick mark at your exact target percentage.

### 🧪 What-If Bunk Sandbox Simulator
- **Interactive Dual Sliders**: Simulate skipping $0$ to $14$ future days or attending $0$ to $21$ future days.
- **Non-Destructive Exploration**: Real-time recalculation of simulated standing, percentage delta (e.g. `+3.4%` or `-6.2%`), and safety status without altering your saved data.
- **Visual Ghost Ring**: Renders an animated cyan ghost ring on the progress gauge contrasting your simulated trajectory against your current standing.

### 📅 Calendar-Aware 7-Day Trajectory Forecast
- **Smart Calendar Filtering**: The 7-day predictive trajectory chart automatically respects weekends, designated school holidays, and declared extra working days.
- **True Class Day Projection**: On non-working days, class totals and percentages remain flat; on class days, daily period density is applied.
- **Off-Day Annotations**: Non-working days are clearly indicated with an asterisk (`* Off-day`) in the chart legend and axis labels.

### 🚨 Smart Instructional-Day Lookahead
- **Next-Class Resolver**: Scans up to 30 days ahead to determine the *next actual class day*. Never warns you about "Sunday Risk"—if tomorrow is an off-day or holiday, it displays **"Tomorrow Off"** and alerts you to your next working session (e.g. *"Monday Risk (Next Class)"*).
- **Quantified Next-Day Drop**: Calculates the exact percentage reduction if the entire upcoming class day is missed.

### ⏰ Morning vs. Evening Today's Classes Timing
- **Morning Mode (`Pending`)**: Checking attendance before classes begin. Today's classes haven't occurred yet, so they are factored into future exam horizon allowance and safe bunk calculations, while Card 3 alerts you to **Today's Risk**.
- **Evening Mode (`Logged`)**: Checking attendance at the end of the day. Today's classes are already part of your recorded total, so future projections start cleanly from tomorrow.

### 🎯 3-Tier Status Classification
- **Comfortable** ($\ge \text{Target} + 5\%$): Substantial buffer above requirement.
- **Borderline** ($\text{Target} \le P < \text{Target} + 5\%$): Safe, but within immediate risk of deficit.
- **Deficit** ($P < \text{Target}$): Below criteria; displays recovery requirements.

### ⚡ Quick-Log Actions & Data Portability
- **One-Click Day Logging**: Dedicated `+1d Attended` and `+1d Missed` buttons for instant daily updates.
- **Instant Restore & Undo**: Accidentally reset or loaded sample data? The session banner allows instant one-click restoration of your previous data.
- **JSON Backup Export & Import**: Download your attendance profile as a structured `.json` backup file and import it anytime across browsers or devices.

### 🌗 Monochromatic Architectural Design
- High-contrast Swiss-inspired typography using **JetBrains Mono** and **Plus Jakarta Sans**.
- Seamless Dark and Light theme toggle with automatic system preference detection.
- Accessible modals with keyboard `Escape` dismissal and ARIA progress indicators.

---

## Mathematical Formulation

Astral Attendance implements deterministic mathematical formulas to guarantee 100% precision.

### 1. Variables

| Symbol | Description | Default |
| :--- | :--- | :--- |
| $T$ | Total classes held to date | User input |
| $A$ | Total classes attended to date | $T - \text{absentClasses}$ |
| $P$ | Current attendance percentage | $(A / T) \times 100$ |
| $\tau$ | Target attendance ratio | $\text{targetPercentage} / 100$ (e.g., $0.75$) |
| $C_d$ | Daily period density (classes per instructional day) | $\text{dailyClasses}$ (e.g., $6$) |

---

### 2. Safe Bunk Allowance ($P \ge \tau \times 100$)

When attendance is equal to or above the target threshold, the maximum number of classes a student can bunk without falling below the target is given by:

$$B = \max\left(0, \, \left\lfloor \frac{A}{\tau} \right\rfloor - T\right)$$

The equivalent safe bunk days is:

$$D_{\text{bunk}} = \lfloor B / C_d \rfloor$$

---

### 3. Recovery Classes Needed ($P < \tau \times 100$)

When attendance falls into deficit, the minimum consecutive classes a student must attend to reach or exceed the target is derived from:

$$\frac{A + R}{T + R} \ge \tau \implies R \ge \frac{\tau \cdot T - A}{1 - \tau}$$

$$R = \max\left(0, \, \left\lceil \frac{\tau \cdot T - A}{1 - \tau} \right\rceil\right)$$

The required consecutive instructional days:

$$D_{\text{recover}} = \lceil R / C_d \rceil$$

---

### 4. Exam Horizon Projection

When an exam date is configured, future working days $D_{\text{work}}$ between the start date (either `today` in Morning Mode or `tomorrow` in Evening Mode) and the exam date (excluding holidays and non-working weekends) are computed:

$$F = D_{\text{work}} \times C_d \quad (\text{Future classes available})$$
$$T_{\text{final}} = T + F \quad (\text{Total classes at semester end})$$
$$A_{\text{target}} = \lceil \tau \times T_{\text{final}} \rceil \quad (\text{Minimum required attended})$$

The maximum achievable attendance percentage (if all future classes are attended):

$$P_{\text{max}} = \frac{A + F}{T_{\text{final}}} \times 100$$

If $P_{\text{max}} < \tau \times 100$, the target is marked **Unreachable**, and the UI alerts the user to the mathematical maximum achievable percentage.

---

### 5. Next Instructional Day Risk

To calculate the impact of missing the next school day, the engine resolves the next working date $d_{\text{next}}$ within a 30-day window:

$$P_{\text{miss}} = \frac{A}{T + C_d} \times 100$$
$$\Delta_{\text{drop}} = P - P_{\text{miss}}$$

---

## Technology Stack

```
Astral Attendance
├── Frontend Framework : React 19 (Hooks, Suspense, Lazy Loading)
├── Language           : TypeScript 5.8 (Strict Type Checking)
├── Build Tooling      : Vite 6 (ESBuild, Rollup Chunks, Fast HMR)
├── Styling Engine     : Tailwind CSS v4 (@tailwindcss/vite)
├── Animation Engine   : Motion / Framer Motion (useSpring, AnimatePresence)
├── Visualization      : Recharts 2.15 (ResponsiveContainer, AreaChart)
├── Iconography        : Lucide React (Tree-shaken feather icons)
└── Deployment Target  : Netlify / Vercel / Static CDN
```

---

## Project Structure

```
astral-attendance/
├── components/
│   ├── Background.tsx       # Ambient architectural grid pattern
│   ├── Calendar.tsx         # Interactive monthly schedule & holiday manager
│   ├── Dashboard.tsx        # Core attendance dashboard, gauge & forecast chart
│   ├── Hero.tsx             # Minimal landing view
│   └── Modal.tsx            # Accessible modal dialog with Escape-key listener
├── public/
│   ├── _redirects           # Netlify SPA single-page routing
│   ├── favicon.svg          # Minimalist graduation cap vector favicon
│   └── site.webmanifest     # PWA standalone manifest configuration
├── utils/
│   └── calculations.ts      # Deterministic mathematical engine & date resolvers
├── App.tsx                  # Root layout, theme provider & header/footer
├── index.css                # Tailwind CSS v4 entry & custom scrollbars
├── index.html               # Clean HTML5 entry with font preconnects & dark mode init
├── index.tsx                # React DOM root hydration
├── netlify.toml             # Netlify deployment configuration
├── package.json             # Project dependencies and build scripts
├── tsconfig.json            # Strict TypeScript configuration
├── types.ts                 # Core data contracts and calculation type definitions
└── vite.config.ts           # Production build optimization & vendor chunking
```

---

## Getting Started

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: `npm` (included with Node.js) or `bun`

### 1. Clone the Repository
```bash
git clone https://github.com/sachin-godara/Astral-Attendance.git
cd Astral-Attendance
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

### 4. Code Quality & Type Check
```bash
npm run lint
```

### 5. Build for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory with vendor code-splitting:
- `dist/assets/vendor-react-*.js` (React & React-DOM)
- `dist/assets/vendor-recharts-*.js` (Recharts visualization engine)
- `dist/assets/vendor-icons-*.js` (Lucide iconography)

### 6. Preview Production Build Locally
```bash
npm run preview
```

---

## Deploying to Production

### Netlify (Recommended)
This repository includes a [`netlify.toml`](file:///f:/Project%20001/astral-attendance/netlify.toml) and [`public/_redirects`](file:///f:/Project%20001/astral-attendance/public/_redirects) pre-configured for instant static hosting:

1. Connect your GitHub repository to [Netlify](https://www.netlify.com/).
2. Netlify will automatically detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Deploy! All client-side SPA routes and assets will resolve cleanly.

### Vercel / Cloudflare Pages / GitHub Pages
Build the static bundle using `npm run build` and point your static provider to the `dist/` folder. Ensure SPA fallback routing redirects all traffic to `/index.html`.

---

## Data Privacy & Security

- **No Remote Servers**: Astral does not transmit your attendance numbers, dates, or schedules to any external API or database.
- **Local Storage**: All data is persisted directly in your browser's `localStorage` under the `attendanceState` key.
- **Portability**: You can export all records as raw JSON at any time using the **Export** button in the header.

---

## Keyboard Accessibility

| Key | Action |
| :--- | :--- |
| `Escape` | Dismiss open modals (Calendar, Developer Info, Settings) |
| `Tab` / `Shift + Tab` | Navigate between input controls and toggle buttons |
| `Enter` / `Space` | Activate toggles, quick-log buttons, and presets |

---

## Author & Credits

Designed and developed by **[Sachin Godara](https://github.com/sachin-godara)**.

Contributions and feature suggestions are welcome! Feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE) — free for personal and educational use.



# DipWise — Tactical ATH DCA & Value Averaging Calculator

[![Angular](https://img.shields.io/badge/Angular-22.2.0-dd0031.svg?style=flat&logo=angular)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8.svg?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed on GitHub Pages](https://img.shields.io/badge/Deployment-GitHub_Pages-22c55e.svg?logo=github)](https://pages.github.com/)

**DipWise** is an open-source, client-side Progressive Web App (PWA) designed for retail investors and financial engineers. It implements a tactical periodic investment strategy (**Value Averaging / Dip Buying**) based on discounts from All-Time Highs (ATH).

Users can manage their own portfolio of funds and ETFs by **ISIN**, persist their configuration 100% locally in the browser, query live market prices, and compute the exact optimal allocation for each investment cycle without loose cents or rounding discrepancies.

---

## Key Features

- **🚀 Modern Angular Architecture**: Built with Angular 22 standalone components, Signal inputs/outputs, computed signals, and `inject()`.
- **📱 PWA & Offline-First**: Built with `@angular/pwa`, Service Worker caching, web app manifest, installable on mobile and desktop.
- **🎨 Tailwind CSS & Dark/Light Mode**: Responsive layout with automatic system theme detection and manual toggle.
- **🛡️ 100% Client-Side Privacy**: No backend server, no tracking, zero database. All assets, settings, and keys are stored solely in `localStorage`.
- **🔄 Live Quotes via ISIN / Ticker**: Automated quote updates with configurable providers (Yahoo Finance via CORS proxy, FinancialModelingPrep, Alpha Vantage, or custom proxy endpoint).
- **✏️ Inline Simulation**: Direct in-table editing of prices and ATH with instant recalculation.
- **⚖️ Hare-Niemeyer Exact Balancing**: Largest Remainder algorithm guarantees the sum of allocations matches your periodic budget to the exact euro/cent (`Difference: 0.00 €`).
- **📊 Interactive Donut Visualizer**: Pure SVG responsive donut chart showing real-time allocation weights.
- **💾 JSON Backup & Restore**: One-click configuration export and import for seamless backups and device transfers.

---

## Financial Calculation Engine

The tactical allocation algorithm operates in five distinct phases:

### 1. Global Portfolio Allocation
- **Periodic Budget**: Configurable (e.g. `600.00 €`).
- **Asset Classes**:
  - Equities (e.g. `90%` = `540.00 €`)
  - Safe Haven / Gold (e.g. `10%` = `60.00 €`)
- **Equities Pool Split**:
  - **Fixed Strategic Base**: `50%` of Equities (`270.00 €`)
  - **Dynamic Tactical Extra**: `50%` of Equities (`270.00 €`)

### 2. Drawdown from ATH
For each asset:
$$\text{Drawdown \%} = \frac{\text{ATH} - \text{Current Price}}{\text{ATH}} \times 100$$

### 3. Momentum & Drawdown Bracket Scale
| Drawdown from ATH | Max Drawdown (%) | Assigned Points | Tactical Financial Behavior |
| :--- | :---: | :---: | :--- |
| **All-Time High / Momentum Zone** | **$\le 2.0\%$** | **16 pts** | 🚀 Peak bullish momentum (ATH breakout & roof consolidation) |
| **Market Noise / Mild Consolidation** | **$\le 5.0\%$** | **4 pts** | ⚖️ Neutral transition zone (neither momentum nor discount) |
| **Initial Pullback** | **$\le 10.0\%$** | **15 pts** | 🛒 Discount buying begins (-5% to -10%) |
| **Technical Correction** | **$\le 15.0\%$** | **17 pts** | 🛒 Moderate discount (-10% to -15%) |
| **Moderate Correction** | **$\le 20.0\%$** | **20 pts** | 🛒 Substantial discount (-15% to -20%) |
| **Bear Market / Opportunity** | **$> 20.0\%$** | **25 – 75 pts** | 💎 Massive accumulation in market crashes (-25%: 25p, -30%: 35p, -35%: 50p, >35%: 75p) |

### 4. Dynamic Distribution
For each Equity asset $i$:
$$\text{Weighted Value}_i = \text{Points}_i \times \text{Dynamic Multiplier}_i$$
$$\text{\% Dynamic Pool}_i = \frac{\text{Weighted Value}_i}{\sum \text{Weighted Values}} \times 100$$
$$\text{Extra (€)}_i = \text{Dynamic Pool (RV)} \times \frac{\text{\% Dynamic Pool}_i}{100}$$
$$\text{Theoretical Allocation}_i = \text{Base Strategic Allocation}_i + \text{Extra (€)}_i$$

*(Note: If all equities are currently at ATH, the dynamic pool is distributed according to their strategic base weights so that 100% of the periodic capital is still deployed).*

### 5. Hare-Niemeyer Exact Balancing (Largest Remainder)
To prevent loose cent or unit discrepancies:
1. Target units $T = \text{Budget} \times \text{Factor}$ (1 for integer euros, 100 for cents).
2. Compute integer floor $f_i = \lfloor u_i \rfloor$ and fractional remainder $r_i = u_i - f_i$.
3. Compute deficit $D = T - \sum f_i$.
4. Sort assets by descending remainder $r_i$ and award 1 unit to the top $D$ assets.
5. Result: $\sum \text{Final Allocation} \equiv \text{Budget}$ with **0.00 € difference**.

---

## Project Structure

```text
dip-wise/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD GitHub Pages deployment
├── public/
│   ├── icons/                    # PWA application icons
│   ├── favicon.ico
│   └── manifest.webmanifest      # PWA Web App Manifest
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/           # TypeScript interfaces & domain types
│   │   │   │   ├── asset.model.ts
│   │   │   │   ├── portfolio.model.ts
│   │   │   │   └── quote.model.ts
│   │   │   └── services/         # Business logic & state management
│   │   │       ├── dca-engine.service.ts
│   │   │       ├── quote.service.ts
│   │   │       ├── storage.service.ts
│   │   │       ├── theme.service.ts
│   │   │       ├── pwa.service.ts
│   │   │       └── toast.service.ts
│   │   ├── features/
│   │   │   ├── dashboard/        # KPIs, table, and donut chart
│   │   │   ├── assets/           # Asset modal (add/edit/lookup)
│   │   │   └── settings/         # Settings modal (strategy, API, backup)
│   │   ├── shared/
│   │   │   └── components/       # Header, toasts, reusable UI
│   │   ├── app.ts                # Main application component
│   │   ├── app.html
│   │   └── app.config.ts         # Angular providers (HTTP, SW, etc.)
│   ├── index.html                # App shell & theme script
│   └── styles.css                # Tailwind CSS v4 styling
├── angular.json
├── package.json
├── tsconfig.json
├── AGENT.md                      # AI Assistant developer reference
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v22+
- [pnpm](https://pnpm.io/) v10+ (`corepack enable pnpm` or `npm install -g pnpm`)

### Installation
```bash
# Clone the repository
git clone https://github.com/MiguelRM90/dip-wise.git
cd dip-wise

# Install dependencies with pnpm
pnpm install
```

### Development Server
```bash
pnpm start
# Navigate to http://localhost:4200/
```

### Running Tests
```bash
pnpm test
```

### Production Build
```bash
pnpm run build
```

---

## GitHub Pages Deployment

### Option 1: Automatic Deployment (Recommended)
This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
1. Push your repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Any push to `main` will automatically build, test, and publish the application to `https://<username>.github.io/dip-wise/`.

### Option 2: Manual CLI Deployment
```bash
pnpm run deploy
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Agent & AI Developer Reference: DipWise

> **Audience**: AI Coding Agents (Antigravity, Cursor, Claude Code, Copilot, Codex, Gemini CLI) and human software engineers maintaining or extending the codebase.

---

## 1. Project Overview & Philosophy

**DipWise** is a client-side Progressive Web App (PWA) written in modern Angular that implements a Tactical Dollar Cost Averaging (DCA) and Value Averaging strategy based on discounts from All-Time Highs (ATH).

### Core Architectural Axioms
1. **Zero External Backend / Database**:
   - The app runs 100% on the client.
   - All state is persisted in `localStorage` through abstract services.
   - No sensitive financial data ever leaves the user's browser.
2. **Modern Angular (Signal-Driven)**:
   - Strict Standalone Components (`imports: [...]` in components, no `NgModule`).
   - Pure Angular Signals (`signal()`, `computed()`, `effect()`, `input()`, `output()`).
   - Dependency injection via `inject()`.
3. **No `any` Types**:
   - Strict TypeScript (`strict: true`). All data structures, API payloads, and events must have explicit interfaces or discriminated unions.
4. **Reliable Exact Balancing**:
   - Uses the **Hare-Niemeyer (Largest Remainder)** algorithm to ensure that every cent or euro matches the designated budget with zero rounding errors.
5. **Tooling & Package Management**:
   - Uses **pnpm** exclusively (`pnpm install`, `pnpm build`, `pnpm test`).

---

## 2. Directory Layout

```text
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── asset.model.ts        # Asset, AssetCategory, QuoteStatus definitions
│   │   │   ├── portfolio.model.ts    # PortfolioSettings, AssetAllocation, PortfolioSummary
│   │   │   └── quote.model.ts        # QuoteFetchResult, YahooChartResponse
│   │   └── services/
│   │       ├── storage.service.ts    # LocalStorage persistence & backup/restore
│   │       ├── dca-engine.service.ts # Pure mathematical allocation engine
│   │       ├── quote.service.ts      # Multi-provider financial market data fetcher
│   │       ├── theme.service.ts      # Dark / Light mode switching & persistence
│   │       ├── pwa.service.ts        # Service worker lifecycle & install prompt
│   │       └── toast.service.ts      # Reactive notification toasts
│   ├── features/
│   │   ├── dashboard/
│   │   │   └── components/
│   │   │       ├── kpi-cards/        # Top KPI financial summary cards
│   │   │       ├── allocation-table/ # Main tactical allocation table with inline editing
│   │   │       └── allocation-chart/ # SVG Donut chart and legend
│   │   ├── assets/
│   │   │   └── components/
│   │   │       └── asset-modal/      # Add / Edit asset modal with live test quote
│   │   └── settings/
│   │       └── components/
│   │           └── settings-modal/   # Portfolio rules, API provider, and backup tabs
│   ├── shared/
│   │   └── components/
│   │       ├── header/               # Brand header with sync button and mode toggles
│   │       └── toast/                # Floating toast container
│   ├── app.ts                        # Root standalone component
│   ├── app.html                      # Main layout template
│   └── app.config.ts                 # ApplicationConfig, provideHttpClient, provideServiceWorker
├── index.html                        # PWA entry, initial dark-theme script
└── styles.css                        # Tailwind CSS v4 entrypoint
```

---

## 3. Mathematical Allocation Algorithm (`DcaEngineService`)

The engine computes allocations via a reactive signal `summary = computed<PortfolioSummary>(...)`.

### Step 1: Drawdown from ATH
$$\text{Drawdown \%} = \frac{\text{ATH} - \text{Current Price}}{\text{ATH}} \times 100$$

### Step 2: Momentum & Bracket Points Scale
| Drawdown Bracket | Points | Financial Behavior |
| :--- | :---: | :--- |
| $\text{Drawdown} \le 2.0\%$ | **16** | 🚀 Peak bullish momentum (ATH breakout & roof consolidation) |
| $2.0\% < \text{Drawdown} \le 5.0\%$ | **4** | ⚖️ Neutral transition zone (market noise) |
| $5.0\% < \text{Drawdown} \le 10.0\%$ | **15** | 🛒 Initial discount buying (-5% to -10%) |
| $10.0\% < \text{Drawdown} \le 15.0\%$ | **17** | 🛒 Technical correction (-10% to -15%) |
| $15.0\% < \text{Drawdown} \le 20.0\%$ | **20** | 🛒 Moderate correction (-15% to -20%) |
| $20.0\% < \text{Drawdown} \le 25.0\%$ | **25** | 💎 Bear market / Strong buying opportunity |
| $25.0\% < \text{Drawdown} \le 30.0\%$ | **35** | 💎 Severe discount accumulation |
| $30.0\% < \text{Drawdown} \le 35.0\%$ | **50** | 💎 Deep crash accumulation |
| $\text{Drawdown} > 35.0\%$ | **75** | 💎 Generational discount accumulation |

### Step 3: Pool Partitioning
- **Equity Budget** = $\text{Total Budget} \times \frac{\text{Equity \%}}{100}$
- **Safe Haven Budget** = $\text{Total Budget} \times \frac{\text{Safe Haven \%}}{100}$
- **Fixed Equity Pool** = $\text{Equity Budget} \times \frac{\text{Fixed Base Ratio \%}}{100}$
- **Dynamic Equity Pool** = $\text{Equity Budget} \times \frac{\text{Dynamic Ratio \%}}{100}$

### Step 4: Equity Dynamic Extra Pool Allocation
For each equity asset $i$:
1. $\text{Weighted Value}_i = \text{Points}_i \times \text{Dynamic Multiplier}_i$
2. $\text{Total Weighted Value} = \sum \text{Weighted Value}_i$
3. If $\text{Total Weighted Value} > 0$:
   $$\text{Extra (€)}_i = \text{Dynamic Equity Pool} \times \frac{\text{Weighted Value}_i}{\text{Total Weighted Value}}$$
   If $\text{Total Weighted Value} == 0$ (all assets at ATH):
   $$\text{Extra (€)}_i = \text{Dynamic Equity Pool} \times \text{Strategic Base Share}_i$$

### Step 5: Exact Hare-Niemeyer Rounding
To guarantee zero residue:
1. Target units $T = \text{round}(\text{Total Budget} \times M)$, where $M = 1$ for integer mode, $M = 100$ for cent mode.
2. For each asset, compute integer floor $l_i = \lfloor A_i \times M \rfloor$ and remainder $r_i = (A_i \times M) - l_i$.
3. Compute deficit $D = T - \sum l_i$.
4. Sort by $r_i$ descending and add 1 unit to the top $D$ elements.
5. $\sum \text{Final Allocation} \equiv \text{Total Budget}$. Difference is guaranteed to be $0.00$ €.

---

## 4. API & CORS Proxy Strategy (`QuoteService`)

Because DipWise runs statically on GitHub Pages, direct cross-origin browser requests to financial services are blocked by browser CORS policies unless routed through a proxy or user-configured endpoint:

- **`yahoo_cors`**: Queries Yahoo Finance Chart API (`/v8/finance/chart/{ticker}?interval=1d&range=1y`) wrapped via `https://api.allorigins.win/raw?url=...` (user configurable in Settings).
- **`fmp`**: FinancialModelingPrep quote endpoint (`apikey` required).
- **`alphavantage`**: Alpha Vantage Global Quote (`apikey` required).
- **`custom_proxy`**: User-defined worker or proxy URL template with `{ticker}` and `{isin}` tokens.
- **Fail-safe Fallback**: If network or provider fails, the asset transitions to `'error'` status and permits manual inline editing right inside the table with immediate reactive recalculation.

---

## 5. Development & Testing Commands

All commands must be executed using **pnpm**:

```bash
# Start local development server
pnpm start

# Run unit tests in headless mode (Vitest)
pnpm test

# Build for local verification
pnpm run build

# Build for GitHub Pages (with 404.html spa fallback)
pnpm run build:gh-pages

# Deploy to GitHub Pages via angular-cli-ghpages
pnpm run deploy
```

---

## 6. Coding & Contribution Rules for AI Agents

1. **Commit Messages & Code Comments**:
   - Write all code, comments, docstrings, variable names, and Git commit messages in **English**.
2. **Reactivity**:
   - Do NOT introduce RxJS Subject/BehaviorSubject for simple state when Angular Signals (`signal()`, `computed()`) suffice.
   - Use `inject()` for DI; avoid constructor parameter injection where possible.
3. **Styles**:
   - Use Tailwind CSS utility classes. Avoid custom CSS files unless defining global CSS variables.
4. **Data Integrity**:
   - Never mutate state directly in arrays or objects. Always return immutable clones (e.g. `this.storage.assets.update(list => [...list, newItem])`).

# Annuity Loan Calculator

Interactive web-based calculator for modeling annuity loans with real-time visualizations, optimization suggestions, and detailed amortization schedules.

**Use this when:** You need to understand the true cost of a loan, evaluate special payment strategies, or compare different repayment scenarios.

## Why This Exists

Most loan calculators show you a number. This one shows you the trade-offs. Built to answer: "What happens if I pay an extra €10k this year?" or "Should I increase my repayment rate or make special payments?" with instant visual feedback and concrete savings calculations.

## Key Features

- **Real-time calculation** — Updates as you type, no submit button needed
- **Special payment modeling** — Add one-time or recurring payments, see exact impact on interest and duration
- **Repayment rate changes** — Model rate increases/decreases at specific dates
- **Interactive D3.js charts** — Timeline view, breakdown pie chart, and comparison visualization
- **Optimization engine** — Automatic suggestions for reducing interest costs
- **Amortization schedule** — Full month-by-month breakdown with CSV export
- **State persistence** — Automatically saves inputs to localStorage
- **Zero dependencies** (runtime) — Pure JavaScript + D3.js, no build step required
- **Offline-capable** — Download D3.js locally for deployment without CDN

## Architecture

**Pure functional core:** All calculations in `calculator.js` are stateless functions. Interest and principal computations use cent-based arithmetic to avoid floating-point errors.

**Modular design:**
- `calculator.js` — Financial math (payment schedules, interest calculations)
- `ui.js` — DOM manipulation, event handling, state management
- `charts.js` — D3.js visualizations (timeline, breakdown, comparison)
- `optimizer.js` — Heuristics for payment optimization suggestions
- `utils.js` — Formatting, date handling, localStorage
- `animations.js` — UI transitions and loading states

**No build step:** ES6 modules loaded directly by the browser. Cache-busting via query params in development.

## Installation

### Prerequisites

One of:
- Python 3.x (most systems have this)
- PHP 7.x+
- Node.js 14+
- [uv](https://github.com/astral-sh/uv) (recommended for Python scripts)

### Clone and Run

```bash
git clone <repository-url>
cd interest
./run.sh
```

The script auto-detects available server tools and opens `http://localhost:8000` in your browser.

**Windows:**
```cmd
run.bat
```

**Manual server start:**
```bash
# Python
python3 -m http.server 8000

# PHP
php -S localhost:8000

# Node.js
npx http-server -p 8000
```

## Usage

### Basic Loan Calculation

1. Enter loan parameters (amount, interest rate, repayment rate, duration)
2. Results update automatically
3. View timeline chart to see balance progression
4. Check optimization suggestions for savings opportunities

### Special Payments

**One-time payment:**
```
Click "Add Special Payment"
→ Enter date and amount
→ See updated payoff date and interest savings
```

**Annual recurring payments:**
```
Set "Default Annual Special Payment" (e.g., 5% of loan)
→ Click "Generate Annual Payments"
→ Creates yearly payments for loan duration
```

### Repayment Rate Changes

Model scenarios like "increase repayment from 2% to 3% after 5 years":
```
Click "Add Repayment Change"
→ Set date and new rate
→ Monthly payment adjusts from that date forward
```

### Export Data

```
Click "Show Table" → "Export CSV"
→ Downloads full amortization schedule
```

## Configuration

### Environment Variables (Deployment Only)

For FTP deployment, create `.env` from `env.example`:

```bash
cp env.example .env
```

Edit `.env`:
```bash
FTP_HOST=ftp.example.com
FTP_USER=your_username
FTP_PASSWORD=your_password
FTP_REMOTE_DIR=/public_html/calculator
```

### Application Defaults

Edit `index.html` form inputs to change default values:
- Principal: `355000` EUR
- Interest rate: `4.13%`
- Repayment rate: `2.00%`
- Duration: `15` years

## Deployment

### FTP Upload (with local D3.js)

```bash
uv run upload.py
```

This script:
1. Downloads D3.js v7 locally (removes CDN dependency)
2. Copies all assets to `.build/`
3. Uploads to FTP server
4. Cleans up build directory

**Why local D3.js?** Some hosting environments block CDN requests or have strict CSP policies. Local copy ensures the calculator works everywhere.

### Static Hosting

Upload these files to any static host:
```
index.html
css/
js/
lib/d3.v7.min.js  (if using local D3.js)
```

Works on: GitHub Pages, Netlify, Vercel, S3, any web server.

## Testing

### Unit Tests

```bash
open tests/test-runner.html
```

Tests cover:
- Monthly payment calculations
- Interest/principal split accuracy
- Special payment application
- Repayment rate changes
- Edge cases (zero interest, full payoff)

**Reference data:** `tests/reference-data.json` contains validated calculations from financial institutions for regression testing.

### Manual Testing

1. Enter known loan parameters from bank documents
2. Compare monthly payment with bank's calculation
3. Verify total interest matches bank's estimate
4. Test special payment scenarios against bank's payoff quotes

## Compatibility

- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **Required features:** ES6 modules, CSS Grid, Fetch API
- **Screen sizes:** Responsive from 320px to 4K

**IE11 not supported.** Use a modern browser.

## Development

### No-cache Server

```bash
uv run server.py
```

Runs on port 8001 with `Cache-Control: no-cache` headers for HTML/CSS/JS. Useful when browsers aggressively cache during development.

### File Structure

```
interest/
├── index.html          # Main app
├── css/
│   ├── styles.css      # Layout, theme, typography
│   └── components.css  # Form elements, cards, buttons
├── js/
│   ├── calculator.js   # Core math
│   ├── ui.js           # Main controller
│   ├── charts.js       # D3.js visualizations
│   ├── optimizer.js    # Suggestion engine
│   ├── utils.js        # Helpers
│   └── animations.js   # UI effects
├── tests/
│   ├── test-runner.html
│   ├── calculator.test.js
│   └── reference-data.json
├── run.sh              # Cross-platform server launcher
├── upload.py           # FTP deployment script
└── server.py           # Dev server with no-cache
```

### Code Style

- **Pure functions** where possible (especially in `calculator.js`)
- **No global state** except localStorage for persistence
- **Explicit units** in variable names (`amountEur`, `ratePercent`, `durationYears`)
- **Cents internally** for money calculations, convert to EUR at boundaries
- **ISO dates** for all date handling

## Contributing

1. Run tests before committing: `open tests/test-runner.html`
2. Verify calculations against reference data
3. Test on mobile devices (responsive layout)
4. Check browser console for errors
5. Keep functions pure in `calculator.js`

**Bug reports:** Include loan parameters that reproduce the issue.

**Feature requests:** Explain the financial scenario you're trying to model.

## License

MIT — Use it, modify it, deploy it. No attribution required but appreciated.

## Disclaimer

This calculator provides estimates for educational purposes. Actual loan terms, fees, and calculations may vary. Always verify with your financial institution before making decisions.

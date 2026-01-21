# Annuity Loan Calculator

Interactive loan calculator with real-time visualizations, optimization suggestions, and detailed amortization schedules. Shows the trade-offs between repayment strategies with instant feedback on interest savings and payoff dates.

**Built to answer:** "What happens if I pay an extra €10k this year?" or "Should I increase my repayment rate or make special payments?"

## Features

- Real-time calculation as you type
- Special payment modeling (one-time or recurring)
- Repayment rate changes at specific dates
- Interactive D3.js charts (timeline, breakdown, comparison)
- Optimization suggestions for reducing interest costs
- Full amortization schedule with CSV export
- State persistence via localStorage
- Zero runtime dependencies, no build step
- Offline-capable with local D3.js

## Quick Start

```bash
git clone <repository-url>
cd interest
./run.sh  # Opens http://localhost:8000
```

**Windows:** `run.bat`

**Requirements:** Python 3.x, PHP 7.x+, or Node.js 14+


## Configuration

Edit `config.yml` to set default loan parameters:

```yaml
loan:
  principal:
    value: 355000  # Default loan amount (EUR)
  interest_rate:
    value: 4.13    # Nominal rate (%)
  tilgung:
    value: 2.00    # Annual repayment rate (%)
  duration:
    value: 15      # Contract duration (years)
```

### Applying Configuration Changes

Configuration changes are **automatically applied** when you run:

```bash
./run.sh      # Applies config.yml, then starts local server
./upload.py   # Applies config.yml to both local and deployed files
```

You can also apply config manually without starting the server:
```bash
./apply-config.py  # Updates index.html with config.yml values
```

**FTP deployment:** Create `.env` with credentials (never commit this file):
```bash
FTP_HOST=ftp.example.com
FTP_USER=username
FTP_PASSWORD=password
FTP_REMOTE_DIR=/public_html/calculator
```

## Deployment

### GitHub Pages

Enable in Settings → Pages → Source: GitHub Actions, then:

```bash
git tag 1.0.0
git push origin 1.0.0
```

Workflow applies `config.yml`, downloads D3.js locally, and deploys. Triggers on semver tags without `v` prefix (`1.0.0`, `2.1.3`, `1.0.0-beta.1`).

### FTP

```bash
./upload.py
```

Applies config, downloads D3.js, uploads to FTP server specified in `.env`.

### Static Hosting

Upload `index.html`, `css/`, `js/`, and optionally `lib/d3.v7.min.js` to any static host (Netlify, Vercel, S3, etc.).

## Architecture

**Pure functional core:** Calculations in `calculator.js` are stateless. Uses cent-based arithmetic to avoid floating-point errors.

**Modules:**
- `calculator.js` — Financial math
- `ui.js` — DOM, events, state
- `charts.js` — D3.js visualizations
- `optimizer.js` — Optimization suggestions
- `utils.js` — Formatting, dates, localStorage
- `animations.js` — UI transitions

**No build step:** ES6 modules loaded directly by browser.

## Testing

```bash
open tests/test-runner.html
```

Covers payment calculations, interest/principal splits, special payments, and edge cases. `tests/reference-data.json` contains validated calculations from financial institutions.

**Compatibility:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Responsive 320px to 4K.

## Development

**No-cache server:** `uv run server.py` (port 8001, disables browser caching)

**Code style:**
- Pure functions in `calculator.js`
- No global state except localStorage
- Explicit units in variable names (`amountEur`, `ratePercent`)
- Cent-based arithmetic for money
- ISO dates

**Contributing:** Run tests (`open tests/test-runner.html`), verify calculations against reference data, test on mobile. Bug reports should include loan parameters that reproduce the issue.

## License

Apache 2.0

## Disclaimer

Estimates for educational purposes. Verify with your financial institution before making decisions.

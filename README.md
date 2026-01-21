# Annuity Loan Calculator

Interactive calculator for annuity loans with real-time calculations and visual insights. See exactly how special payments and rate changes impact your financial future.

## Quick Start

```bash
./run.sh  # Local dev at http://localhost:8000
```

**Deploy to FTP:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh  # One-time
cp env.example .env  # Add FTP credentials
uv run upload.py     # Deploy
```

Windows: Use `run.bat`

## What It Does

- **Real-time calculations** — Change any value, see results instantly
- **Special payments** — Add extra payments, see interest savings per payment
- **Rate changes** — Adjust repayment rate over time, see immediate impact
- **Visual comparison** — Timeline chart shows your plan vs. baseline
- **Annual generator** — Create 40 years of payments with one click
- **Export** — Download amortization table as CSV

### Example Impact

```
Loan: €355,000 @ 4.13%, 2% repayment
Add: €17,750 annually
Result: Paid off in 27 years (vs. 40), saves €100,000+ in interest
```

## How Repayment Rate Works

**Critical:** Repayment rate is a percentage of the **original loan amount**, not remaining balance.

```
Loan: €355,000
2.0% → €591.67/month
2.1% → €621.25/month (+€29.58)
Result: 8 months earlier, saves €6,531
```

Increasing rate = saves interest ✅  
Decreasing rate = costs more interest ⚠️

## Mobile Optimizations

**Responsive charts** — No horizontal scrolling, legends below charts on mobile  
**Results-first layout** — Metrics and charts appear before input form on mobile  
**Optimized readability** — Shorter currency format (€355k), fewer axis ticks, smaller fonts

Desktop: Side-by-side (inputs left, results right)  
Mobile/Tablet (≤1024px): Stacked (results first, inputs below)

## Technical Stack

**Frontend:** Vanilla JavaScript (ES6+), D3.js v7  
**No build tools:** Pure HTML/CSS/JS  
**Zero config:** Scripts use inline dependencies (PEP 723)

```
js/
  calculator.js    # Financial calculations
  charts.js        # D3.js visualizations (responsive)
  ui.js            # Event handling, resize listeners
  optimizer.js     # Optimization suggestions
  utils.js         # Formatting utilities
  animations.js    # UI animations

css/
  styles.css       # Layout, responsive reordering
  components.css   # Component styles, chart responsiveness
```

## FTP Deployment

The upload script:
1. Downloads D3.js (~250KB) from CDN
2. Modifies `index.html` to use local D3.js
3. Uploads only production files (~600KB total)

**What gets uploaded:**
- `index.html` (modified)
- `css/*.css`
- `js/*.js`
- `lib/d3.v7.min.js` (downloaded)

**FTP credentials** (`.env`):
```env
FTP_HOST=ftp.yourserver.com
FTP_USER=your_username
FTP_PASSWORD=your_password
FTP_REMOTE_DIR=/public_html/calculator
```

## Testing

```bash
./run.sh
# Visit: http://localhost:8000/tests/test-runner.html
```

20+ test cases covering calculations, special payments, rate changes, and edge cases.

## Troubleshooting

**Page not loading?**
- Check browser console (F12)
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Charts not showing?**
- Check if D3.js loaded (Network tab in F12)
- Clear browser cache

**CORS errors?**
- Don't open `index.html` directly
- Use `./run.sh` to start a server

**uv not found?**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Samsung Internet

## Design Philosophy

Minimal, functional design inspired by [kibotu.net/calendar](https://kibotu.net/calendar/):
- Monochromatic (green for savings only)
- Flat (no shadows or gradients)
- Clear typography, generous whitespace
- Mobile-first responsive approach
- Pragmatic solutions over complexity

## Financial Accuracy

Calculations tested against banking calculators, Excel PMT function, and real-world scenarios.

**Important:** This is for estimation. Always verify with your bank before making financial decisions.

## Accessibility

- Full keyboard navigation
- ARIA labels for screen readers
- High contrast support
- Respects `prefers-reduced-motion`
- Zoom friendly (up to 200%)
- Touch-friendly targets on mobile (44px minimum)

## License

MIT

---

**Remember:** This helps you understand your loan, but always consult a financial advisor for major decisions.

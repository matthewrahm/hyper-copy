# hyper-copy

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Hyperliquid](https://img.shields.io/badge/Hyperliquid-API-00C853)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

Copy trading platform for Hyperliquid perpetuals. Track top traders, score them, and mirror their trades with risk controls.

Every trader's positions, fills, and PnL on Hyperliquid are fully on-chain and publicly readable. This platform scores traders on win rate, ROI, Sharpe ratio, drawdown, and consistency, then lets you copy their trades proportionally into your own account. Monetized via Builder Code fees on every copied trade.

<!-- ![Demo](demo.gif) -->

## Features

### Trader Leaderboard

Ranks Hyperliquid traders by a composite score (0-100) computed from 6 weighted metrics: ROI (25%), win rate (20%), Sharpe ratio (20%), max drawdown inverse (15%), trade count (10%), and longevity (10%). Submit any wallet address to add it to the leaderboard. Scores refresh automatically every 30 minutes.

### Trader Profiles

Full profile page for any tracked trader showing account value, PnL stats, score breakdown with visual bars, live positions (10s refresh), and recent trade history. All data pulled directly from Hyperliquid's on-chain state.

### Copy Trading with Risk Controls

Mirror a trader's positions proportionally scaled to your account size. Configure per-copy risk parameters:

- **Max position size** -- cap how large any single copied position can be (% of account)
- **Max total exposure** -- limit total portfolio allocation to copied positions
- **Max drawdown kill switch** -- automatically stop copying if drawdown exceeds threshold
- **Token whitelist/blacklist** -- control which assets can be copied

### Paper Mode

Copy engine runs in paper mode by default. Monitors leader positions every 5 seconds, detects opens/closes/adjustments, generates proportional orders, and logs everything to the database without executing real trades. Verify the strategy before going live.

### Live Execution with Builder Code

When ready, switch to live mode. Orders execute through Hyperliquid's agent wallet system with Builder Code fees attached. The copier approves your agent wallet once, and all subsequent trades are signed and executed automatically.

## How It Works

### Scoring

The scorer fetches up to 10,000 fills (90 days), groups them into round-trip trades (position goes from 0 to non-zero back to 0), and computes:

| Metric | Weight | What it measures |
|--------|--------|-----------------|
| ROI | 25% | Total PnL relative to max capital deployed |
| Win Rate | 20% | Percentage of profitable round-trip trades |
| Sharpe Ratio | 20% | Risk-adjusted returns (return / volatility) |
| Max Drawdown | 15% | Worst peak-to-trough decline (lower = better) |
| Trade Count | 10% | Activity level (capped at 100 trades) |
| Longevity | 10% | How long they've been active (capped at 6 months) |

### Copy Engine

1. Polls leader's `clearinghouseState` every 5 seconds
2. Diffs current positions against last known state
3. Detects: new positions (open), closed positions, size increases, size decreases
4. Generates proportional orders: `(leader_position_value / leader_account_value) * copier_account_value`
5. Validates each order against risk controls (position size, exposure, drawdown, token filters)
6. In paper mode: logs to database. In live mode: executes via agent wallet with Builder Code fee

### Builder Code Revenue

Every copied trade includes a Builder Code fee (default 0.05%) paid by the copier. This is how the platform generates revenue. The fee is configurable and capped at 0.1% for perps.

## Architecture

```
Web Dashboard (Next.js)
    |
    v
FastAPI REST API
    |
    v
LeaderboardManager ---- Database (SQLite)
    |                        |
    v                        v
TraderScorer             CopyEngine
    |                    /        \
    v                   v          v
HyperliquidTraderClient    RiskManager    OrderExecutor
    |                                         |
    v                                         v
api.hyperliquid.xyz                    Agent Wallet + Builder Code
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, Geist fonts |
| API | FastAPI, uvicorn |
| Data Layer | Python 3.11+, httpx |
| Execution | hyperliquid-python-sdk, eth-account |
| Database | SQLite |
| Caching | In-memory TTL cache |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) package manager

### Install

```bash
git clone https://github.com/matthewrahm/hyper-copy.git
cd hyper-copy
cd web && npm install && cd ..
```

### Run

```bash
# Both servers
./scripts/dev.sh

# Or separately
uv run uvicorn api.main:app --reload --port 8001
cd web && npm run dev -- --port 3002
```

Open http://localhost:3002

### Configure (for live execution)

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_WALLET_KEY` | For live mode | Agent wallet private key (approved via approveAgent) |
| `BUILDER_ADDRESS` | For live mode | Your builder wallet address for fee collection |
| `BUILDER_FEE` | Optional | Fee in tenths of bps (default: 50 = 0.05%) |
| `HL_NETWORK` | Optional | mainnet or testnet (default: mainnet) |

### Live Execution Setup

1. Generate an agent wallet (any new Ethereum private key)
2. On Hyperliquid, call `approveAgent` with your agent wallet address
3. Call `approveBuilderFee` with your builder address and max fee rate
4. Set `AGENT_WALLET_KEY` and `BUILDER_ADDRESS` in `.env`
5. Run copy engine in live mode

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/leaderboard` | Ranked trader list (sortable, filterable) |
| `GET /api/trader/{address}` | Full trader profile (score + positions + fills) |
| `GET /api/trader/{address}/positions` | Live positions |
| `GET /api/trader/{address}/fills` | Recent trade history |
| `POST /api/trader` | Submit new address for tracking |
| `POST /api/copy` | Create copy configuration |
| `GET /api/copy/{copier}` | List active copies |
| `DELETE /api/copy/{copier}/{leader}` | Stop copying |
| `PUT /api/copy/{copier}/{leader}` | Update risk parameters |
| `GET /api/copy/{copier}/log` | Copy order log |

## Project Structure

```
hyper-copy/
  pyproject.toml
  .env.example
  api/
    main.py                 # FastAPI app, lifespan, background refresh
    routes.py               # All REST endpoints
    schemas.py              # Pydantic response models
  src/hyper_copy/
    client.py               # Hyperliquid trader data client
    scorer.py               # Trader scoring engine
    leaderboard.py          # Leaderboard manager
    copy_engine.py          # Position monitor + copy order generator
    executor.py             # Live order execution (Builder Code)
    risk.py                 # Risk controls per copier
    db.py                   # SQLite persistence
    models.py               # All dataclasses
    cache.py                # TTL cache
    config.py               # Environment configuration
    seeds.py                # Seed whale addresses
  web/
    app/
      page.tsx              # Leaderboard page
      trader/[address]/     # Trader detail page
      copies/               # Copy management dashboard
      components/           # All UI components
      hooks/                # useAutoRefresh
    lib/
      api.ts                # Typed API client
      utils.ts              # Formatters
  scripts/
    dev.sh                  # Run both servers
    test_fetch.py           # Test data fetching
    test_score.py           # Test scoring
    test_leaderboard.py     # Test leaderboard
    test_copy.py            # Test copy engine (paper mode)
  data/                     # SQLite database (gitignored)
```

## License

MIT

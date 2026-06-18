# $OPM Market Maker (Hummingbot)

A lightweight, cloud-hosted market-making bot that keeps the OPM order book tight and
liquid so real buyers and sellers get good execution on a 10,000-token micro-supply.

> **This is not part of the Next.js app.** It runs separately on your own server
> (AWS / DigitalOcean / any Docker host). The web app links to it conceptually; the bot
> itself executes on-chain/exchange orders independently.

## Compliance first

Wash trading — using a bot to manufacture fake volume — is **illegal** under EU and
German financial law (Market Abuse Regulation, WpHG). This setup is intentionally a
**pure market-making / execution-quality** configuration:

- Tight, transparent two-sided spreads (real depth, not fake prints).
- Inventory skew enabled, so the bot rebalances toward a 50/50 target instead of
  pushing price one way.
- `ping_pong_enabled: false` and no self-crossing — the bot must never trade against
  its own orders to inflate volume.
- Quotes anchored to an external reference price to avoid quoting off a manipulated mid.

Keep spreads tight, transparent, and focused entirely on smooth execution for real users.

## What it does

1. Places small, staggered bid/ask orders around fair value.
2. Refreshes them on a randomized cadence so quotes track the market naturally.
3. Manages inventory to stay balanced, reducing directional impact.

## Prerequisites

- A Docker host (1 vCPU / 1 GB RAM is enough for a single pair).
- An OPM/ETH (or OPM/USDC) market — a DEX connector (Uniswap) or a CEX listing.
- A funded trading wallet/account (use a dedicated account, not your treasury).

## Quick start

```bash
# 1. Clone these files onto your server
mkdir -p conf logs data
cp conf_pure_mm_opm.yml conf/

# 2. Set a config password used to encrypt secrets
export HUMMINGBOT_PASSWORD="choose-a-strong-password"

# 3. Launch
docker compose up -d
docker attach opm-hummingbot

# 4. Inside the Hummingbot CLI
#    - connect your exchange/wallet (keys entered interactively, never committed)
#    - import the strategy:  import conf_pure_mm_opm.yml
#    - start:                start
```

## Tuning notes

| Parameter | Effect |
|---|---|
| `bid_spread` / `ask_spread` | Lower = tighter market, more fills, less margin. |
| `order_amount` | Size per level. Keep small vs. total supply. |
| `order_levels` | More levels = deeper book. |
| `order_refresh_time` | How often quotes re-center on fair value. |
| `inventory_target_base_pct` | Target OPM/quote balance (keep ~50%). |

## Security

- Never commit private keys or API keys. They are entered at runtime and encrypted
  with `HUMMINGBOT_PASSWORD`.
- Run on a dedicated wallet/account with only the working capital you intend to quote.
- Monitor `./logs` for fills and inventory drift.

import { NextRequest, NextResponse } from "next/server"

const INFURA_URL = process.env.INFURA_URL || ""
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || ""
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || ""

const OPM_ADDRESS = "0xE430b07F7B168E77B07b29482DbF89EafA53f484"
const POOL_ADDRESS = "0x1ddb29e16c6b0cc23fea7fd42cf3f6bd368b30c0"

const CHAIN_RPCS: Record<string, string> = {
  ethereum: INFURA_URL || `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  bsc: "https://bsc-dataseed1.binance.org",
  polygon: `https://polygon-mainnet.infura.io/v3/${INFURA_URL.split("/").pop()}`,
  arbitrum: `https://arbitrum-mainnet.infura.io/v3/${INFURA_URL.split("/").pop()}`,
  optimism: `https://optimism-mainnet.infura.io/v3/${INFURA_URL.split("/").pop()}`,
}

async function rpcCall(chain: string, method: string, params: unknown[]) {
  const url = CHAIN_RPCS[chain] || CHAIN_RPCS.ethereum
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })
  const data = await res.json()
  return data.result
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")
  const address = req.nextUrl.searchParams.get("address")
  const chain = req.nextUrl.searchParams.get("chain") || "ethereum"

  try {
    switch (action) {
      case "balance": {
        if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 })
        const ethBalance = await rpcCall(chain, "eth_getBalance", [address, "latest"])
        const balanceOf = "0x70a08231" + address.slice(2).padStart(64, "0")
        const opmBalance = await rpcCall(chain, "eth_call", [{ to: OPM_ADDRESS, data: balanceOf }, "latest"])
        return NextResponse.json({
          ethBalance: ethBalance ? (parseInt(ethBalance, 16) / 1e18).toString() : "0",
          opmBalance: opmBalance ? (parseInt(opmBalance, 16) / 1e18).toString() : "0",
        })
      }

      case "token-balances": {
        if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 })
        const tokens = [
          { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
          { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
          { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
          { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EesdfDCADE517D", decimals: 18 },
          { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
        ]
        const balances: Record<string, string> = {}
        for (const token of tokens) {
          try {
            const data = "0x70a08231" + address.slice(2).padStart(64, "0")
            const result = await rpcCall(chain, "eth_call", [{ to: token.address, data }, "latest"])
            balances[token.symbol] = result ? (parseInt(result, 16) / 10 ** token.decimals).toString() : "0"
          } catch {
            balances[token.symbol] = "0"
          }
        }
        return NextResponse.json({ balances })
      }

      case "price": {
        let price = 259.58
        let priceChange = 2.4
        let volume = 45000
        let marketCap = price * 10000
        let holders = 21

        try {
          const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/ethereum/${POOL_ADDRESS}`, {
            next: { revalidate: 30 },
          })
          if (dsRes.ok) {
            const dsData = await dsRes.json()
            if (dsData.pair) {
              price = parseFloat(dsData.pair.priceUsd) || price
              priceChange = parseFloat(dsData.pair.priceChange?.h24) || priceChange
              volume = parseFloat(dsData.pair.volume?.h24) || volume
              marketCap = parseFloat(dsData.pair.fdv) || marketCap
            }
          }
        } catch { /* fallback */ }

        try {
          if (ETHERSCAN_KEY) {
            const holdersRes = await fetch(
              `https://api.etherscan.io/api?module=token&action=tokenholdercount&contractaddress=${OPM_ADDRESS}&apikey=${ETHERSCAN_KEY}`,
              { next: { revalidate: 300 } }
            )
            if (holdersRes.ok) {
              const holdersData = await holdersRes.json()
              if (holdersData.result) holders = parseInt(holdersData.result) || holders
            }
          }
        } catch { /* fallback */ }

        return NextResponse.json({ price, priceChange, volume, marketCap, holders, totalSupply: 10000 })
      }

      case "transactions": {
        if (!address || !ETHERSCAN_KEY)
          return NextResponse.json({ transactions: [] })
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${OPM_ADDRESS}&address=${address}&sort=desc&apikey=${ETHERSCAN_KEY}`
        const res = await fetch(url, { next: { revalidate: 60 } })
        const data = await res.json()
        const txs = (data.result || []).slice(0, 20).map((tx: Record<string, string>) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: (parseInt(tx.value) / 1e18).toFixed(4),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          direction: tx.to?.toLowerCase() === address?.toLowerCase() ? "in" : "out",
        }))
        return NextResponse.json({ transactions: txs })
      }

      case "lock-status": {
        if (!address || !ETHERSCAN_KEY)
          return NextResponse.json({ firstReceived: null, isLocked: true, daysRemaining: 365 })
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${OPM_ADDRESS}&address=${address}&sort=asc&page=1&offset=1&apikey=${ETHERSCAN_KEY}`
        const res = await fetch(url, { next: { revalidate: 300 } })
        const data = await res.json()
        if (data.result?.[0]) {
          const firstTx = data.result[0]
          const firstDate = new Date(parseInt(firstTx.timeStamp) * 1000)
          const lockEnd = new Date(firstDate.getTime() + 365 * 24 * 60 * 60 * 1000)
          const now = new Date()
          const isLocked = now < lockEnd
          const daysRemaining = isLocked ? Math.ceil((lockEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
          return NextResponse.json({
            firstReceived: firstDate.toISOString(),
            lockEnd: lockEnd.toISOString(),
            isLocked,
            daysRemaining,
          })
        }
        return NextResponse.json({ firstReceived: null, isLocked: true, daysRemaining: 365 })
      }

      case "gas": {
        const gasPrice = await rpcCall(chain, "eth_gasPrice", [])
        const blockNumber = await rpcCall(chain, "eth_blockNumber", [])
        return NextResponse.json({
          gasPrice: gasPrice ? Math.round(parseInt(gasPrice, 16) / 1e9) : 20,
          blockNumber: blockNumber ? parseInt(blockNumber, 16) : 0,
        })
      }

      case "swap-quote": {
        const fromToken = req.nextUrl.searchParams.get("from") || ""
        const toToken = req.nextUrl.searchParams.get("to") || ""
        const amount = req.nextUrl.searchParams.get("amount") || "0"
        try {
          const res = await fetch(
            `https://api.1inch.dev/swap/v6.0/1/quote?src=${fromToken}&dst=${toToken}&amount=${amount}&includeGas=true`,
            { headers: { Authorization: "Bearer " + (process.env.ONEINCH_API_KEY || "") } }
          )
          if (res.ok) {
            const data = await res.json()
            return NextResponse.json(data)
          }
        } catch { /* fallback */ }
        return NextResponse.json({ estimatedGas: 150000, toAmount: "0" })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

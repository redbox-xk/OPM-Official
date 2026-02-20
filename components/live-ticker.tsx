"use client"

import { useState, useEffect } from "react"
import { Activity, Fuel, Box } from "lucide-react"

export function LiveTicker() {
  const [gasPrice, setGasPrice] = useState(20)
  const [blockNumber, setBlockNumber] = useState(0)
  const [ethPrice, setEthPrice] = useState(3900)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/blockchain?action=gas")
        if (res.ok) {
          const data = await res.json()
          setGasPrice(data.gasPrice || 20)
          setBlockNumber(data.blockNumber || 0)
        }
      } catch { /* silent */ }
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
        if (res.ok) {
          const data = await res.json()
          setEthPrice(data.ethereum?.usd || 3900)
        }
      } catch { /* silent */ }
    }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-card/60 backdrop-blur border-b border-[#D4A537]/10 overflow-hidden">
      <div className="flex items-center gap-6 px-4 py-1.5 text-xs font-mono animate-ticker whitespace-nowrap"
        style={{ width: "200%" }}>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="neon-dot" /> <span className="text-muted-foreground">ETH</span>{" "}
              <span className="text-foreground font-semibold">${ethPrice.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3 h-3 text-[#D4A537]" /> <span className="text-muted-foreground">Gas</span>{" "}
              <span className="text-foreground font-semibold">{gasPrice} Gwei</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Box className="w-3 h-3 text-[#D4A537]" /> <span className="text-muted-foreground">Block</span>{" "}
              <span className="text-foreground font-semibold">#{blockNumber.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-green-500" /> <span className="text-green-400">Mainnet Live</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

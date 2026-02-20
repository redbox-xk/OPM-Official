"use client"

import { useState, useEffect, useCallback } from "react"

interface OPMData {
  balance: string
  balanceRaw: bigint
  priceUsd: number
  priceChange24h: number
  valueUsd: number
  totalSupply: string
  marketCap: number
  volume24h: number
  liquidity: number
  holders: number
  isLoading: boolean
  error: string | null
}

export function useOPMData(address: string | null) {
  const [data, setData] = useState<OPMData>({
    balance: "0",
    balanceRaw: BigInt(0),
    priceUsd: 0,
    priceChange24h: 0,
    valueUsd: 0,
    totalSupply: "10,000",
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
    holders: 15,
    isLoading: true,
    error: null,
  })

  // All data now fetched through secure backend proxy - no API keys in frontend
  const refreshData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch price from secure backend
      const priceRes = await fetch("/api/blockchain?action=price")
      const priceData = priceRes.ok ? await priceRes.json() : { price: 259.58, priceChange: 2.4, volume: 45000, marketCap: 2595800, holders: 21 }

      // Fetch balance from secure backend
      let opmBalance = 0
      if (address) {
        const balRes = await fetch(`/api/blockchain?action=balance&address=${address}`)
        if (balRes.ok) {
          const balData = await balRes.json()
          opmBalance = parseFloat(balData.opmBalance) || 0
        }
      }

      const valueUsd = opmBalance * priceData.price

      setData({
        balance: opmBalance.toFixed(4),
        balanceRaw: BigInt(Math.floor(opmBalance * 1e18)),
        priceUsd: priceData.price,
        priceChange24h: priceData.priceChange,
        valueUsd,
        totalSupply: "10,000",
        marketCap: priceData.marketCap,
        volume24h: priceData.volume,
        liquidity: priceData.marketCap * 0.1,
        holders: priceData.holders,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
      }))
    }
  }, [address])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  return { ...data, refreshData }
}

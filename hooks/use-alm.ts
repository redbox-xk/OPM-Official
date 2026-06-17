"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserProvider, Contract, formatUnits } from "ethers"
import { ALM_VAULT_ADDRESS, ALM_VAULT_ABI, isDeployed } from "@/lib/contracts"

export interface ALMState {
  deployed: boolean
  isLoading: boolean
  totalSupply: number
  tickLower: number
  tickUpper: number
  rangeWidthTicks: number
  maxDeviationBps: number
  lastRebalance: number
  minRebalanceInterval: number
  userShares: number
}

const EMPTY: ALMState = {
  deployed: false,
  isLoading: true,
  totalSupply: 0,
  tickLower: 0,
  tickUpper: 0,
  rangeWidthTicks: 600,
  maxDeviationBps: 100,
  lastRebalance: 0,
  minRebalanceInterval: 3600,
  userShares: 0,
}

export function useALM(address: string | null) {
  const [state, setState] = useState<ALMState>(EMPTY)
  const deployed = isDeployed(ALM_VAULT_ADDRESS)

  const refresh = useCallback(async () => {
    if (!deployed || typeof window === "undefined" || !window.ethereum) {
      setState({ ...EMPTY, isLoading: false, deployed })
      return
    }
    try {
      const provider = new BrowserProvider(window.ethereum as never)
      const alm = new Contract(ALM_VAULT_ADDRESS, ALM_VAULT_ABI, provider)
      const [totalSupply, tickLower, tickUpper, rangeWidth, maxDev, lastReb, minInt] =
        await Promise.all([
          alm.totalSupply() as Promise<bigint>,
          alm.tickLower() as Promise<bigint>,
          alm.tickUpper() as Promise<bigint>,
          alm.rangeWidthTicks() as Promise<bigint>,
          alm.maxDeviationBps() as Promise<bigint>,
          alm.lastRebalance() as Promise<bigint>,
          alm.minRebalanceInterval() as Promise<bigint>,
        ])

      let userShares = 0
      if (address) {
        userShares = Number(formatUnits((await alm.balanceOf(address)) as bigint, 18))
      }

      setState({
        deployed: true,
        isLoading: false,
        totalSupply: Number(formatUnits(totalSupply, 18)),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        rangeWidthTicks: Number(rangeWidth),
        maxDeviationBps: Number(maxDev),
        lastRebalance: Number(lastReb),
        minRebalanceInterval: Number(minInt),
        userShares,
      })
    } catch (err) {
      console.error("[v0] useALM refresh failed:", err)
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [address, deployed])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return { ...state, refresh }
}

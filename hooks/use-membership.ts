"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers"
import {
  MEMBERSHIP_VAULT_ADDRESS,
  MEMBERSHIP_VAULT_ABI,
  MEMBERSHIP_NFT_ADDRESS,
  MEMBERSHIP_NFT_ABI,
  ERC20_FULL_ABI,
  OPM_TOKEN_ADDRESS,
  isDeployed,
  tierForLocked,
  type MembershipTier,
} from "@/lib/contracts"

export interface MembershipState {
  opmBalance: number
  lockedAmount: number
  pendingRewards: number
  allowance: number
  tier: number
  hasNFT: boolean
  lockedUntil: number
  totalStaked: number
  isLoading: boolean
  deployed: boolean
}

const EMPTY: MembershipState = {
  opmBalance: 0,
  lockedAmount: 0,
  pendingRewards: 0,
  allowance: 0,
  tier: 0,
  hasNFT: false,
  lockedUntil: 0,
  totalStaked: 0,
  isLoading: true,
  deployed: false,
}

export function useMembership(address: string | null) {
  const [state, setState] = useState<MembershipState>(EMPTY)
  const [txPending, setTxPending] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)

  const deployed = isDeployed(MEMBERSHIP_VAULT_ADDRESS)

  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum) return null
    return new BrowserProvider(window.ethereum as never)
  }, [])

  const refresh = useCallback(async () => {
    if (!address) {
      setState({ ...EMPTY, isLoading: false })
      return
    }
    const provider = getProvider()
    if (!provider) {
      setState({ ...EMPTY, isLoading: false })
      return
    }

    try {
      const opm = new Contract(OPM_TOKEN_ADDRESS, ERC20_FULL_ABI, provider)
      const rawOpm = (await opm.balanceOf(address)) as bigint
      const opmBalance = Number(formatUnits(rawOpm, 18))

      if (!deployed) {
        // Contracts not yet deployed: show real OPM balance, derive a preview tier.
        setState({
          ...EMPTY,
          opmBalance,
          isLoading: false,
          deployed: false,
        })
        return
      }

      const vault = new Contract(MEMBERSHIP_VAULT_ADDRESS, MEMBERSHIP_VAULT_ABI, provider)
      const [info, pending, totalStaked, allowanceRaw] = await Promise.all([
        vault.userInfo(address) as Promise<[bigint, bigint, bigint]>,
        vault.pendingRewards(address) as Promise<bigint>,
        vault.totalStaked() as Promise<bigint>,
        opm.allowance(address, MEMBERSHIP_VAULT_ADDRESS) as Promise<bigint>,
      ])

      let tier = 0
      let hasNFT = false
      if (isDeployed(MEMBERSHIP_NFT_ADDRESS)) {
        const nft = new Contract(MEMBERSHIP_NFT_ADDRESS, MEMBERSHIP_NFT_ABI, provider)
        tier = Number((await nft.tierOfOwner(address)) as bigint)
        hasNFT = tier > 0
      }

      setState({
        opmBalance,
        lockedAmount: Number(formatUnits(info[0], 18)),
        lockedUntil: Number(info[2]),
        pendingRewards: Number(formatUnits(pending, 6)), // reward token (USDC) = 6 decimals
        allowance: Number(formatUnits(allowanceRaw, 18)),
        tier,
        hasNFT,
        totalStaked: Number(formatUnits(totalStaked, 18)),
        isLoading: false,
        deployed: true,
      })
    } catch (err) {
      console.error("[v0] useMembership refresh failed:", err)
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [address, deployed, getProvider])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  const ensureSigner = useCallback(async () => {
    const provider = getProvider()
    if (!provider) throw new Error("No wallet provider")
    return provider.getSigner()
  }, [getProvider])

  const approve = useCallback(
    async (amount: string) => {
      setTxError(null)
      setTxPending(true)
      try {
        const signer = await ensureSigner()
        const opm = new Contract(OPM_TOKEN_ADDRESS, ERC20_FULL_ABI, signer)
        const tx = await opm.approve(MEMBERSHIP_VAULT_ADDRESS, parseUnits(amount, 18))
        await tx.wait()
        await refresh()
      } catch (err) {
        setTxError(err instanceof Error ? err.message : "Approval failed")
      } finally {
        setTxPending(false)
      }
    },
    [ensureSigner, refresh],
  )

  const stake = useCallback(
    async (amount: string) => {
      setTxError(null)
      setTxPending(true)
      try {
        const signer = await ensureSigner()
        const vault = new Contract(MEMBERSHIP_VAULT_ADDRESS, MEMBERSHIP_VAULT_ABI, signer)
        const tx = await vault.stake(parseUnits(amount, 18))
        await tx.wait()
        await refresh()
      } catch (err) {
        setTxError(err instanceof Error ? err.message : "Stake failed")
      } finally {
        setTxPending(false)
      }
    },
    [ensureSigner, refresh],
  )

  const unstake = useCallback(
    async (amount: string) => {
      setTxError(null)
      setTxPending(true)
      try {
        const signer = await ensureSigner()
        const vault = new Contract(MEMBERSHIP_VAULT_ADDRESS, MEMBERSHIP_VAULT_ABI, signer)
        const tx = await vault.unstake(parseUnits(amount, 18))
        await tx.wait()
        await refresh()
      } catch (err) {
        setTxError(err instanceof Error ? err.message : "Unstake failed")
      } finally {
        setTxPending(false)
      }
    },
    [ensureSigner, refresh],
  )

  const claim = useCallback(async () => {
    setTxError(null)
    setTxPending(true)
    try {
      const signer = await ensureSigner()
      const vault = new Contract(MEMBERSHIP_VAULT_ADDRESS, MEMBERSHIP_VAULT_ABI, signer)
      const tx = await vault.claim()
      await tx.wait()
      await refresh()
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Claim failed")
    } finally {
      setTxPending(false)
    }
  }, [ensureSigner, refresh])

  const previewTier: MembershipTier | null = tierForLocked(
    state.lockedAmount > 0 ? state.lockedAmount : 0,
  )

  return {
    ...state,
    txPending,
    txError,
    refresh,
    approve,
    stake,
    unstake,
    claim,
    previewTier,
  }
}

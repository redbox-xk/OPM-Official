"use client"

import { useState, useCallback, useEffect, useRef } from "react"

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

export type WalletType = "metamask" | "opm-wallet" | null

export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  walletType: WalletType
}

const SUPPORTED_CHAIN_IDS: Record<number, string> = {
  1: "Ethereum",
  56: "BNB Smart Chain",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
}

function detectMobile(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent || navigator.vendor || (window as Record<string, unknown>).opera as string || ""
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS/i.test(ua)
}

function hasMetaMaskExtension(): boolean {
  if (typeof window === "undefined") return false
  return !!(window.ethereum && window.ethereum.isMetaMask)
}

function openMetaMaskDeepLink() {
  const dappUrl = window.location.href.replace(/^https?:\/\//, "")
  const isAndroid = /Android/i.test(navigator.userAgent)
  if (isAndroid) {
    window.location.href = `intent://dapp/${dappUrl}#Intent;scheme=metamask;package=io.metamask;end`
    setTimeout(() => { window.location.href = `https://metamask.app.link/dapp/${dappUrl}` }, 500)
  } else {
    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`
  }
}

export function useWallet(autoConnect = false) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    walletType: null,
  })
  const hasAttemptedAutoConnect = useRef(false)

  // Restore saved OPM wallet session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("opm_wallet_session")
      if (saved) {
        const session = JSON.parse(saved)
        if (session.address && session.type === "opm-wallet") {
          setState({
            isConnected: true,
            address: session.address,
            chainId: session.chainId || 1,
            isConnecting: false,
            error: null,
            walletType: "opm-wallet",
          })
        }
      }
    } catch { /* ignore */ }
  }, [])

  const checkConnection = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[]
        if (accounts.length > 0) {
          const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string
          setState({
            isConnected: true,
            address: accounts[0],
            chainId: Number.parseInt(chainId, 16),
            isConnecting: false,
            error: null,
            walletType: "metamask",
          })
          return true
        }
      } catch { /* silent */ }
    }
    return false
  }, [])

  const connect = useCallback(async () => {
    const isMobile = detectMobile()
    const hasMetaMask = hasMetaMaskExtension()

    if (isMobile && !hasMetaMask) {
      openMetaMaskDeepLink()
      return
    }

    if (!hasMetaMask) {
      setState((prev) => ({
        ...prev,
        error: "MetaMask not detected. Install MetaMask or use OPM Wallet.",
      }))
      return
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }))

    try {
      const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[]
      const chainId = (await window.ethereum!.request({ method: "eth_chainId" })) as string
      setState({
        isConnected: true,
        address: accounts[0],
        chainId: Number.parseInt(chainId, 16),
        isConnecting: false,
        error: null,
        walletType: "metamask",
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }))
    }
  }, [])

  // Connect using OPM non-custodial wallet
  const connectOPMWallet = useCallback((walletAddress: string) => {
    setState({
      isConnected: true,
      address: walletAddress,
      chainId: 1,
      isConnecting: false,
      error: null,
      walletType: "opm-wallet",
    })
    localStorage.setItem("opm_wallet_session", JSON.stringify({
      address: walletAddress,
      type: "opm-wallet",
      chainId: 1,
    }))
  }, [])

  // Switch chain (MetaMask only)
  const switchChain = useCallback(async (targetChainId: number) => {
    if (state.walletType !== "metamask" || !window.ethereum) return
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      })
      setState((prev) => ({ ...prev, chainId: targetChainId }))
    } catch (err: unknown) {
      const e = err as { code?: number }
      if (e.code === 4902) {
        setState((prev) => ({ ...prev, error: "Add this network to MetaMask first." }))
      }
    }
  }, [state.walletType])

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      walletType: null,
    })
    localStorage.removeItem("opm_wallet_session")
  }, [])

  useEffect(() => {
    const init = async () => {
      const alreadyConnected = await checkConnection()
      if (autoConnect && !alreadyConnected && !hasAttemptedAutoConnect.current) {
        hasAttemptedAutoConnect.current = true
        if (hasMetaMaskExtension()) {
          setTimeout(() => connect(), 500)
        }
      }
    }
    init()

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccounts = (accounts: unknown) => {
        const accs = accounts as string[]
        if (accs.length === 0) disconnect()
        else setState((prev) => ({ ...prev, address: accs[0] }))
      }
      const handleChain = (chainId: unknown) => {
        setState((prev) => ({ ...prev, chainId: Number.parseInt(chainId as string, 16) }))
      }
      window.ethereum.on("accountsChanged", handleAccounts)
      window.ethereum.on("chainChanged", handleChain)
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccounts)
        window.ethereum?.removeListener("chainChanged", handleChain)
      }
    }
  }, [checkConnection, disconnect, autoConnect, connect])

  return {
    ...state,
    connect,
    connectOPMWallet,
    switchChain,
    disconnect,
    hasMetaMask: typeof window !== "undefined" && hasMetaMaskExtension(),
    isMobile: typeof window !== "undefined" && detectMobile(),
    chainName: state.chainId ? SUPPORTED_CHAIN_IDS[state.chainId] || `Chain ${state.chainId}` : null,
  }
}

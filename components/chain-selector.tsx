"use client"

import { useState } from "react"
import { SUPPORTED_CHAINS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check } from "lucide-react"

interface ChainSelectorProps {
  currentChainId: number | null
  onSwitch: (chainId: number) => void
  walletType: string | null
}

const CHAIN_ICONS: Record<string, string> = {
  ETHEREUM: "ETH",
  BSC: "BNB",
  POLYGON: "POL",
  ARBITRUM: "ARB",
  OPTIMISM: "OP",
}

export function ChainSelector({ currentChainId, onSwitch, walletType }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentChain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === currentChainId) || SUPPORTED_CHAINS.ETHEREUM

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-[#D4A537]/20 bg-card/80 text-xs font-mono"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="neon-dot" />
        <span>{currentChain.name}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 bg-card border border-[#D4A537]/20 rounded-lg shadow-xl overflow-hidden">
            {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
              <button
                key={key}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted/50 transition-colors text-left"
                onClick={() => {
                  onSwitch(chain.id)
                  setIsOpen(false)
                }}
                disabled={walletType !== "metamask" && chain.id !== 1}
              >
                <span className="font-mono font-bold text-[#D4A537] w-8">{CHAIN_ICONS[key]}</span>
                <span className="text-foreground flex-1">{chain.name}</span>
                {currentChainId === chain.id && <Check className="w-3 h-3 text-green-500" />}
              </button>
            ))}
            {walletType !== "metamask" && (
              <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border">
                Multi-chain switching requires MetaMask
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { useWallet } from "@/hooks/use-wallet"
import { useALM } from "@/hooks/use-alm"
import { useOPMData } from "@/hooks/use-opm-data"
import {
  Layers,
  Activity,
  Gauge,
  ShieldCheck,
  Clock,
  Droplets,
  Info,
  ArrowLeftRight,
} from "lucide-react"

export default function ALMVaultPage() {
  const { address } = useWallet(true)
  const alm = useALM(address)
  const { priceUsd: price } = useOPMData(address)

  const lastRebalanceLabel = useMemo(() => {
    if (!alm.lastRebalance) return "Never"
    return new Date(alm.lastRebalance * 1000).toLocaleString()
  }, [alm.lastRebalance])

  // Band visualization: center the active price within the configured tick range.
  const activePrice = price || 259.58
  const halfWidthPct = Math.min(40, alm.rangeWidthTicks / 60) // illustrative width
  const lowerPrice = activePrice * (1 - halfWidthPct / 100)
  const upperPrice = activePrice * (1 + halfWidthPct / 100)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />
      <Header />

      <main className="container relative z-10 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Automated Liquidity Management</span>
            </div>
            <h1 className="text-balance font-serif text-3xl font-bold md:text-5xl">
              ALM Smart Vault
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
              The vault dynamically compresses OPM/ETH liquidity into a tight range around the active
              trading price. This minimizes slippage so large buyers and sellers can move without
              breaking the chart on a {Number(10000).toLocaleString()}-token micro-supply.
            </p>
          </div>

          {!alm.deployed && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="text-sm">
                <p className="font-semibold text-amber-400">Vault not yet deployed</p>
                <p className="text-muted-foreground">
                  Deploy <code className="rounded bg-background/60 px-1 py-0.5 text-xs">OPMLiquidityVault</code>{" "}
                  and set its address in{" "}
                  <code className="rounded bg-background/60 px-1 py-0.5 text-xs">lib/contracts.ts</code>.
                  Values below show the default rebalancing configuration.
                </p>
              </div>
            </div>
          )}

          {/* Liquidity range visualization */}
          <div className="mb-8 rounded-2xl border border-border/50 bg-card/40 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
                <Activity className="h-5 w-5 text-primary" /> Active Liquidity Range
              </h2>
              <span className="text-sm text-muted-foreground">OPM/ETH</span>
            </div>

            <div className="relative mx-auto max-w-3xl">
              {/* Range band */}
              <div className="relative h-24 rounded-xl bg-secondary/40">
                <div
                  className="absolute top-0 bottom-0 rounded-xl bg-primary/20 border-x-2 border-primary"
                  style={{ left: "20%", right: "20%" }}
                >
                  <div className="absolute -top-6 left-0 -translate-x-1/2 text-xs text-muted-foreground">
                    ${lowerPrice.toFixed(2)}
                  </div>
                  <div className="absolute -top-6 right-0 translate-x-1/2 text-xs text-muted-foreground">
                    ${upperPrice.toFixed(2)}
                  </div>
                </div>
                {/* Active price marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary animate-pulse-glow">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    ${activePrice.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Liquidity is concentrated in the highlighted band (±{halfWidthPct.toFixed(1)}%). When the
                price drifts outside, the keeper calls{" "}
                <code className="rounded bg-background/60 px-1 py-0.5 text-xs">rebalance()</code> to
                re-center it.
              </p>
            </div>
          </div>

          {/* Parameters */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ParamCard
              icon={<Droplets className="h-4 w-4" />}
              label="Vault Shares Supply"
              value={alm.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            />
            <ParamCard
              icon={<Gauge className="h-4 w-4" />}
              label="Range Width (ticks)"
              value={`±${alm.rangeWidthTicks}`}
            />
            <ParamCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Max Oracle Deviation"
              value={`${(alm.maxDeviationBps / 100).toFixed(2)}%`}
            />
            <ParamCard
              icon={<Clock className="h-4 w-4" />}
              label="Rebalance Interval"
              value={`${Math.round(alm.minRebalanceInterval / 60)} min`}
            />
            <ParamCard
              icon={<ArrowLeftRight className="h-4 w-4" />}
              label="Tick Lower"
              value={String(alm.tickLower)}
            />
            <ParamCard
              icon={<ArrowLeftRight className="h-4 w-4" />}
              label="Tick Upper"
              value={String(alm.tickUpper)}
            />
            <ParamCard
              icon={<Clock className="h-4 w-4" />}
              label="Last Rebalance"
              value={lastRebalanceLabel}
            />
            <ParamCard
              icon={<Layers className="h-4 w-4" />}
              label="Your Vault Shares"
              value={alm.userShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            />
          </div>

          {/* Safety explainer */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-card/40 p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Oracle-Guarded Rebalancing
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Before re-centering, the vault reads a Chainlink reference price and rejects the
                operation if the pool price and oracle diverge beyond the deviation cap, or if the oracle
                data is stale. This defends against sandwich attacks and manipulated mid-prices during
                rebalances.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Droplets className="h-4 w-4 text-primary" /> Why It Forces Circulation
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tight, well-placed liquidity dramatically reduces slippage. Large buyers can enter and
                exit without breaking the chart, giving institutional and luxury users the confidence to
                pass $OPM back and forth, keeping trading velocity healthy.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ParamCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="terminal-card rounded-xl p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="truncate font-mono text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

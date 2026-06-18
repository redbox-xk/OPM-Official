"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { MembershipTierGrid } from "@/components/membership-tier-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWallet } from "@/hooks/use-wallet"
import { useMembership } from "@/hooks/use-membership"
import { tierForLocked, nextTier, MEMBERSHIP_TIERS } from "@/lib/contracts"
import {
  Crown,
  Lock,
  Unlock,
  Gift,
  Loader2,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Info,
} from "lucide-react"

export default function StakingPage() {
  const { isConnected, address, connect, isConnecting } = useWallet(true)
  const membership = useMembership(address)

  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")

  const lockedTier = useMemo(() => tierForLocked(membership.lockedAmount), [membership.lockedAmount])
  const upcoming = useMemo(() => nextTier(lockedTier), [lockedTier])

  const stakeNum = Number.parseFloat(stakeAmount) || 0
  const needsApproval = stakeNum > 0 && stakeNum > membership.allowance
  const projectedLocked = membership.lockedAmount + stakeNum
  const projectedTier = tierForLocked(projectedLocked)

  const lockExpired = membership.lockedUntil === 0 || Date.now() / 1000 >= membership.lockedUntil
  const lockDate =
    membership.lockedUntil > 0 ? new Date(membership.lockedUntil * 1000).toLocaleString() : null

  const formatNum = (n: number, d = 4) =>
    n.toLocaleString(undefined, { maximumFractionDigits: d })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />
      <Header />

      <main className="container relative z-10 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Locked-Utility Membership</span>
            </div>
            <h1 className="text-balance font-serif text-3xl font-bold md:text-5xl">
              Lock $OPM. Mint Your Soulbound Membership.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
              Wrap your OPM into the staking vault to mint a non-transferable membership NFT across the
              6-tier system. Locking reduces circulating supply and unlocks tiered platform benefits and
              reward sharing.
            </p>
          </div>

          {/* Not deployed banner */}
          {!membership.deployed && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="text-sm">
                <p className="font-semibold text-amber-400">Contracts not yet deployed</p>
                <p className="text-muted-foreground">
                  The membership vault address is not set. Deploy the contracts with{" "}
                  <code className="rounded bg-background/60 px-1 py-0.5 text-xs">
                    scripts/deploy-ecosystem.js
                  </code>{" "}
                  and paste the addresses into{" "}
                  <code className="rounded bg-background/60 px-1 py-0.5 text-xs">lib/contracts.ts</code>.
                  The interface below previews your tier from your live OPM balance.
                </p>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Lock className="h-4 w-4" />}
              label="Your Locked OPM"
              value={formatNum(membership.lockedAmount)}
            />
            <StatCard
              icon={<Crown className="h-4 w-4" />}
              label="Membership Tier"
              value={
                membership.tier > 0
                  ? `${membership.tier} · ${MEMBERSHIP_TIERS[membership.tier - 1]?.name ?? ""}`
                  : lockedTier
                    ? `${lockedTier.tier} · ${lockedTier.name}`
                    : "None"
              }
            />
            <StatCard
              icon={<Gift className="h-4 w-4" />}
              label="Pending Rewards"
              value={`$${formatNum(membership.pendingRewards, 2)}`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total Value Locked"
              value={`${formatNum(membership.totalStaked, 2)} OPM`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Action panel */}
            <div className="lg:col-span-1">
              <div className="terminal-card sticky top-24 rounded-2xl p-6">
                {!isConnected ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Wallet className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet to lock OPM and manage your membership.
                    </p>
                    <Button
                      onClick={connect}
                      disabled={isConnecting}
                      className="min-h-[44px] w-full bg-gradient-to-r from-amber-600 to-yellow-500 font-semibold text-black hover:from-amber-500 hover:to-yellow-400"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting...
                        </>
                      ) : (
                        "Connect Wallet"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Lock */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="h-4 w-4 text-primary" /> Lock OPM
                        </label>
                        <button
                          type="button"
                          onClick={() => setStakeAmount(String(membership.opmBalance))}
                          className="text-xs text-primary hover:underline"
                        >
                          Balance: {formatNum(membership.opmBalance)}
                        </button>
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="mb-2 text-lg"
                      />
                      {stakeNum > 0 && projectedTier && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          After locking: Tier {projectedTier.tier} · {projectedTier.name} (
                          {projectedTier.discount}% discount)
                        </p>
                      )}
                      {needsApproval ? (
                        <Button
                          onClick={() => membership.approve(stakeAmount)}
                          disabled={membership.txPending || !membership.deployed || stakeNum <= 0}
                          className="min-h-[44px] w-full"
                          variant="outline"
                        >
                          {membership.txPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                          )}
                          Approve OPM
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            membership.stake(stakeAmount)
                            setStakeAmount("")
                          }}
                          disabled={
                            membership.txPending ||
                            !membership.deployed ||
                            stakeNum <= 0 ||
                            stakeNum > membership.opmBalance
                          }
                          className="min-h-[44px] w-full bg-gradient-to-r from-amber-600 to-yellow-500 font-semibold text-black hover:from-amber-500 hover:to-yellow-400"
                        >
                          {membership.txPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          Lock &amp; Mint Membership
                        </Button>
                      )}
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Unlock */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Unlock className="h-4 w-4 text-muted-foreground" /> Unlock OPM
                        </label>
                        <button
                          type="button"
                          onClick={() => setUnstakeAmount(String(membership.lockedAmount))}
                          className="text-xs text-primary hover:underline"
                        >
                          Locked: {formatNum(membership.lockedAmount)}
                        </button>
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="mb-2 text-lg"
                      />
                      {!lockExpired && lockDate && (
                        <p className="mb-2 flex items-center gap-1.5 text-xs text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> Locked until {lockDate}
                        </p>
                      )}
                      <Button
                        onClick={() => {
                          membership.unstake(unstakeAmount)
                          setUnstakeAmount("")
                        }}
                        disabled={
                          membership.txPending ||
                          !membership.deployed ||
                          !lockExpired ||
                          (Number.parseFloat(unstakeAmount) || 0) <= 0 ||
                          (Number.parseFloat(unstakeAmount) || 0) > membership.lockedAmount
                        }
                        variant="outline"
                        className="min-h-[44px] w-full"
                      >
                        Unlock
                      </Button>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Claim */}
                    <Button
                      onClick={membership.claim}
                      disabled={
                        membership.txPending || !membership.deployed || membership.pendingRewards <= 0
                      }
                      className="min-h-[44px] w-full"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Claim ${formatNum(membership.pendingRewards, 2)} Rewards
                    </Button>

                    {membership.txError && (
                      <p className="text-xs text-destructive">{membership.txError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tier grid + circulation explainer */}
            <div className="space-y-6 lg:col-span-2">
              <div>
                <h2 className="mb-4 font-serif text-xl font-bold">The 6-Tier Membership System</h2>
                <MembershipTierGrid
                  currentTier={membership.tier || lockedTier?.tier || 0}
                  lockedAmount={membership.lockedAmount}
                />
              </div>

              {upcoming && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="text-muted-foreground">
                    Lock{" "}
                    <span className="font-semibold text-primary">
                      {formatNum(upcoming.minLocked - membership.lockedAmount)} more OPM
                    </span>{" "}
                    to reach Tier {upcoming.tier} · {upcoming.name} ({upcoming.discount}% discount).
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-border/50 bg-card/40 p-5">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" /> How this supports the $OPM chart
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  With a micro-supply of only {Number(10000).toLocaleString()} tokens, every locked OPM
                  reduces circulating supply and sell pressure. A configurable fraction of staking-reward
                  yield is automatically routed back into the OPM/ETH liquidity pool, deepening liquidity
                  over time. Membership is soulbound (non-transferable), so tiers reflect genuine
                  long-term holders rather than speculative flips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function StatCard({
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
      <p className="truncate font-serif text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

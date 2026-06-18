"use client"

import { Crown, Lock, Check } from "lucide-react"
import { MEMBERSHIP_TIERS } from "@/lib/contracts"

interface MembershipTierGridProps {
  currentTier: number
  lockedAmount: number
}

export function MembershipTierGrid({ currentTier, lockedAmount }: MembershipTierGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {MEMBERSHIP_TIERS.map((tier) => {
        const isActive = currentTier === tier.tier
        const isUnlocked = currentTier >= tier.tier
        return (
          <div
            key={tier.tier}
            className={`relative rounded-xl border p-5 transition-all ${
              isActive
                ? "border-primary bg-primary/10 shadow-[0_0_25px_hsl(var(--gold)/0.15)]"
                : isUnlocked
                  ? "border-primary/40 bg-card/60"
                  : "border-border/50 bg-card/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${tier.color}22`, color: tier.color }}
                >
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tier {tier.tier}</p>
                  <p className="font-serif text-base font-bold text-foreground">{tier.name}</p>
                </div>
              </div>
              {isActive ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  Active
                </span>
              ) : isUnlocked ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="mb-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{tier.minLocked}</span>
              <span className="text-sm text-muted-foreground">OPM locked</span>
            </div>

            <p className="mb-3 text-sm font-medium text-primary">{tier.discount}% platform discount</p>

            <ul className="space-y-1.5">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

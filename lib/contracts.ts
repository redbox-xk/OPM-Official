// Frontend contract addresses + minimal ABIs for the OnePremium Locked-Utility ecosystem.
//
// IMPORTANT: The vault/membership/ALM contracts must be deployed (see scripts/deploy-ecosystem.js)
// and their addresses pasted below. Until then the DApp runs in "not deployed" mode and the UI
// guides the user accordingly instead of throwing.

import { OPM_TOKEN_ADDRESS } from "./constants"

export { OPM_TOKEN_ADDRESS }

// Replace the zero-addresses with the real deployment output.
export const MEMBERSHIP_VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"
export const MEMBERSHIP_NFT_ADDRESS = "0x0000000000000000000000000000000000000000"
export const ALM_VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function isDeployed(addr: string): boolean {
  return !!addr && addr.toLowerCase() !== ZERO_ADDRESS
}

// 6-tier system: locked OPM thresholds + benefits.
export interface MembershipTier {
  tier: number
  name: string
  minLocked: number
  discount: number
  color: string
  perks: string[]
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    tier: 1,
    name: "Initiate",
    minLocked: 1,
    discount: 5,
    color: "#CD7F32",
    perks: ["Soulbound membership badge", "5% platform discount", "Community access"],
  },
  {
    tier: 2,
    name: "Associate",
    minLocked: 3,
    discount: 10,
    color: "#C0C0C0",
    perks: ["10% platform discount", "Early drop access", "Priority support"],
  },
  {
    tier: 3,
    name: "Premier",
    minLocked: 5,
    discount: 20,
    color: "#D4A537",
    perks: ["20% platform discount", "Exclusive events", "Reward boost"],
  },
  {
    tier: 4,
    name: "Elite",
    minLocked: 10,
    discount: 30,
    color: "#E5E4E2",
    perks: ["30% platform discount", "Concierge access", "Higher reward share"],
  },
  {
    tier: 5,
    name: "Sovereign",
    minLocked: 25,
    discount: 40,
    color: "#B9F2FF",
    perks: ["40% platform discount", "VIP allocations", "Governance weight"],
  },
  {
    tier: 6,
    name: "Premium Black",
    minLocked: 50,
    discount: 50,
    color: "#1a1a1a",
    perks: ["50% platform discount", "All benefits", "Founder circle access"],
  },
]

export function tierForLocked(lockedOpm: number): MembershipTier | null {
  let result: MembershipTier | null = null
  for (const t of MEMBERSHIP_TIERS) {
    if (lockedOpm >= t.minLocked) result = t
  }
  return result
}

export function nextTier(current: MembershipTier | null): MembershipTier | null {
  const currentTierNum = current?.tier ?? 0
  return MEMBERSHIP_TIERS.find((t) => t.tier === currentTierNum + 1) ?? null
}

// --- ABIs (human-readable, ethers v6 compatible) ---

export const ERC20_FULL_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]

export const MEMBERSHIP_VAULT_ABI = [
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claim()",
  "function userInfo(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lockedUntil)",
  "function pendingRewards(address) view returns (uint256)",
  "function currentTier(address) view returns (uint8)",
  "function totalStaked() view returns (uint256)",
  "function lockDuration() view returns (uint256)",
  "function poolRouteBps() view returns (uint16)",
  "event Locked(address indexed user, uint256 amount, uint8 tier)",
  "event Unlocked(address indexed user, uint256 amount, uint8 tier)",
]

export const MEMBERSHIP_NFT_ABI = [
  "function tierOfOwner(address) view returns (uint8)",
  "function tokenIdOf(address) view returns (uint256)",
  "function locked(uint256) view returns (bool)",
]

export const ALM_VAULT_ABI = [
  "function deposit(uint256 amount0, uint256 amount1) returns (uint256)",
  "function withdraw(uint256 shares) returns (uint256, uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tickLower() view returns (int24)",
  "function tickUpper() view returns (int24)",
  "function rangeWidthTicks() view returns (int24)",
  "function maxDeviationBps() view returns (uint16)",
  "function lastRebalance() view returns (uint256)",
  "function minRebalanceInterval() view returns (uint256)",
  "function oraclePrice() view returns (uint256, uint8)",
]

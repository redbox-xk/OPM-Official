"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"
import { useWallet } from "@/hooks/use-wallet"
import { LanguageSwitcher } from "./language-switcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Wallet, LogOut, ArrowRightLeft, Activity, FileCode, Key, CreditCard } from "lucide-react"
import { ChainSelector } from "./chain-selector"

export function Header() {
  const { t } = useLanguage()
  const { isConnected, address, connect, disconnect, isConnecting, walletType, chainId, switchChain } = useWallet()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "#about", label: t.nav.about },
    { href: "#whitepaper", label: t.nav.whitepaper },
    { href: "#roadmap", label: t.nav.roadmap },
    { href: "#tokenomics", label: t.nav.tokenomics },
    { href: "/dex", label: "DEX", icon: ArrowRightLeft },
    { href: "/price-watcher", label: "Markets", icon: Activity },
  ]

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/30">
            <Image src="/images/opm-logo-200.png" alt="OnePremium" fill className="object-cover" />
          </div>
          <span className="font-serif text-xl font-bold text-gradient">OnePremium</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {isConnected ? (
            <div className="hidden sm:flex items-center gap-2">
              <ChainSelector currentChainId={chainId} onSwitch={switchChain} walletType={walletType} />
              <Button variant="outline" size="sm" className="gap-2 border-primary/50 text-primary bg-transparent font-mono text-xs">
                <span className="neon-dot" />
                {formatAddress(address!)}
                {walletType === "opm-wallet" && <Key className="h-3 w-3 ml-1 text-[#D4A537]" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={disconnect} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                onClick={connect}
                disabled={isConnecting}
                size="sm"
                className="gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? t.connect.connecting : "MetaMask"}
              </Button>
              <Link href="/wallet">
                <Button size="sm" variant="outline" className="gap-1.5 border-[#D4A537]/30 text-foreground">
                  <Key className="h-3.5 w-3.5" />
                  OPM Wallet
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background border-border">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-foreground p-2 rounded-lg hover:bg-primary/5"
                  >
                    {item.icon && <item.icon className="h-5 w-5 text-primary" />}
                    {item.label}
                  </Link>
                ))}
                <hr className="border-border" />
                <Link
                  href="/smart-contracts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-foreground p-2 rounded-lg hover:bg-primary/5"
                >
                  <FileCode className="h-5 w-5 text-primary" />
                  Smart Contracts
                </Link>
                <hr className="border-border" />
                {isConnected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <ChainSelector currentChainId={chainId} onSwitch={switchChain} walletType={walletType} />
                    </div>
                    <Button variant="outline" className="w-full gap-2 border-primary/50 text-primary bg-transparent font-mono text-xs">
                      <span className="neon-dot" />
                      {formatAddress(address!)}
                      {walletType === "opm-wallet" && <Key className="h-3 w-3 text-[#D4A537]" />}
                    </Button>
                    <Button variant="ghost" onClick={() => { disconnect(); setIsOpen(false) }} className="w-full gap-2">
                      <LogOut className="h-4 w-4" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => { connect(); setIsOpen(false) }}
                      disabled={isConnecting}
                      className="w-full gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-black"
                    >
                      <Wallet className="h-4 w-4" /> MetaMask
                    </Button>
                    <Link href="/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 border-[#D4A537]/30">
                        <Key className="h-4 w-4" /> OPM Wallet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

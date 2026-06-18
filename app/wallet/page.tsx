"use client"

import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"
import { useWallet } from "@/hooks/use-wallet"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Shield, Key, Download, Copy, Check, Eye, EyeOff, AlertTriangle, Wallet,
  ArrowLeft, Lock, RefreshCw, FileKey, Import, Smartphone, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import {
  createWallet,
  importFromPrivateKey,
  importFromMnemonic,
  encryptPrivateKey,
  downloadBackup,
  isValidAddress,
  isValidMnemonic,
  type CreatedWallet,
} from "@/lib/wallet-crypto"

type Step = "choose" | "create" | "confirm-seed" | "set-password" | "import-key" | "import-seed" | "login" | "complete"

export default function WalletPage() {
  const { language } = useLanguage()
  const { connectOPMWallet } = useWallet()

  const [step, setStep] = useState<Step>("choose")
  const [wallet, setWallet] = useState<CreatedWallet | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showSeed, setShowSeed] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [seedConfirmation, setSeedConfirmation] = useState("")
  const [importKey, setImportKey] = useState("")
  const [importSeed, setImportSeed] = useState("")
  const [acceptedRisk, setAcceptedRisk] = useState(false)
  const [acceptedNoCustody, setAcceptedNoCustody] = useState(false)
  const [acceptedNoRecovery, setAcceptedNoRecovery] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const en = language === "en"

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreateWallet = () => {
    const newWallet = createWallet()
    setWallet(newWallet)
    setStep("create")
  }

  const handleConfirmSeed = () => {
    if (!wallet) return
    const words = wallet.mnemonic.split(" ")
    const inputWords = seedConfirmation.trim().toLowerCase().split(/\s+/)
    if (inputWords.length !== words.length || inputWords.some((w, i) => w !== words[i])) {
      setError(en ? "Seed phrase does not match. Please try again." : "Seed-Phrase stimmt nicht. Bitte versuchen Sie es erneut.")
      return
    }
    setError("")
    setStep("set-password")
  }

  const handleSetPassword = async () => {
    if (password.length < 8) {
      setError(en ? "Password must be at least 8 characters." : "Passwort muss mindestens 8 Zeichen haben.")
      return
    }
    if (password !== confirmPassword) {
      setError(en ? "Passwords do not match." : "Passworter stimmen nicht uberein.")
      return
    }
    if (!wallet) return

    setIsProcessing(true)
    setError("")
    try {
      const encrypted = await encryptPrivateKey(wallet.privateKey, password)
      downloadBackup(wallet.address, encrypted)
      connectOPMWallet(wallet.address)
      setStep("complete")
    } catch {
      setError(en ? "Encryption failed. Please try again." : "Verschlusselung fehlgeschlagen.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportKey = async () => {
    try {
      const imported = importFromPrivateKey(importKey.trim())
      setWallet({ ...imported, mnemonic: "" })
      setStep("set-password")
    } catch {
      setError(en ? "Invalid private key." : "Ungultiger privater Schlussel.")
    }
  }

  const handleImportSeed = async () => {
    if (!isValidMnemonic(importSeed)) {
      setError(en ? "Invalid seed phrase." : "Ungultige Seed-Phrase.")
      return
    }
    try {
      const imported = importFromMnemonic(importSeed.trim())
      setWallet(imported)
      setStep("set-password")
    } catch {
      setError(en ? "Failed to import wallet." : "Wallet-Import fehlgeschlagen.")
    }
  }

  const allDisclaimersAccepted = acceptedRisk && acceptedNoCustody && acceptedNoRecovery

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Choose Method */}
          {step === "choose" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D4A537]/20 mb-4">
                  <Wallet className="w-8 h-8 text-[#D4A537]" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {en ? "OPM Wallet" : "OPM Wallet"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {en ? "Non-custodial. Your keys, your crypto." : "Nicht-verwahrt. Ihre Schlussel, Ihre Krypto."}
                </p>
              </div>

              {/* Risk Disclaimers */}
              <Card className="border-[#D4A537]/20 bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                    {en ? "Important Disclaimers" : "Wichtige Hinweise"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptedRisk} onCheckedChange={(c) => setAcceptedRisk(!!c)} className="mt-0.5" />
                    <span className="text-xs text-muted-foreground">
                      {en
                        ? "I understand cryptocurrency investments carry significant risk and I may lose my entire investment."
                        : "Ich verstehe, dass Kryptowahrungsinvestitionen erhebliche Risiken bergen."}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptedNoCustody} onCheckedChange={(c) => setAcceptedNoCustody(!!c)} className="mt-0.5" />
                    <span className="text-xs text-muted-foreground">
                      {en
                        ? "I understand this is a non-custodial wallet. Only I am responsible for my private keys and seed phrase."
                        : "Ich verstehe, dass dies eine nicht-verwahrte Wallet ist. Nur ich bin fur meine Schlussel verantwortlich."}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptedNoRecovery} onCheckedChange={(c) => setAcceptedNoRecovery(!!c)} className="mt-0.5" />
                    <span className="text-xs text-muted-foreground">
                      {en
                        ? "I understand that if I lose my password, private key, and seed phrase, my funds cannot be recovered by anyone."
                        : "Ich verstehe, dass bei Verlust meines Passworts und Seed-Phrase niemand meine Gelder wiederherstellen kann."}
                    </span>
                  </label>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleCreateWallet}
                  disabled={!allDisclaimersAccepted}
                  className="w-full h-14 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold text-base"
                >
                  <Key className="w-5 h-5 mr-2" />
                  {en ? "Create New Wallet" : "Neue Wallet erstellen"}
                </Button>
                <Button
                  onClick={() => setStep("import-seed")}
                  disabled={!allDisclaimersAccepted}
                  variant="outline"
                  className="w-full h-12 border-[#D4A537]/30 text-foreground"
                >
                  <Import className="w-4 h-4 mr-2" />
                  {en ? "Import via Seed Phrase" : "Mit Seed-Phrase importieren"}
                </Button>
                <Button
                  onClick={() => setStep("import-key")}
                  disabled={!allDisclaimersAccepted}
                  variant="outline"
                  className="w-full h-12 border-[#D4A537]/30 text-foreground"
                >
                  <FileKey className="w-4 h-4 mr-2" />
                  {en ? "Import via Private Key" : "Mit privatem Schlussel importieren"}
                </Button>
              </div>

              <div className="text-center">
                <Link href="/" className="text-sm text-muted-foreground hover:text-[#D4A537] inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  {en ? "Back to Home" : "Zuruck zur Startseite"}
                </Link>
              </div>
            </div>
          )}

          {/* Create Wallet - Show Seed */}
          {step === "create" && wallet && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {en ? "Your Recovery Phrase" : "Ihre Wiederherstellungsphrase"}
                </h2>
                <p className="text-sm text-red-400 font-medium">
                  {en ? "Write this down and store it safely. Never share it." : "Schreiben Sie dies auf und bewahren Sie es sicher auf."}
                </p>
              </div>

              {/* Address */}
              <Card className="border-[#D4A537]/20 bg-card/80 backdrop-blur">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">{en ? "Your Address" : "Ihre Adresse"}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-foreground bg-muted/50 rounded px-2 py-1 flex-1 truncate">{wallet.address}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(wallet.address, "address")}>
                      {copied === "address" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Seed Phrase */}
              <Card className="border-red-500/30 bg-card/80 backdrop-blur">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-red-400 font-medium">{en ? "Seed Phrase (12 words)" : "Seed-Phrase (12 Worter)"}</p>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowSeed(!showSeed)}>
                      {showSeed ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {showSeed ? (en ? "Hide" : "Verbergen") : (en ? "Reveal" : "Anzeigen")}
                    </Button>
                  </div>
                  {showSeed ? (
                    <div className="grid grid-cols-3 gap-2">
                      {wallet.mnemonic.split(" ").map((word, i) => (
                        <div key={i} className="bg-muted/50 rounded px-2 py-1.5 text-xs">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          <span className="text-foreground font-mono">{word}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                      {en ? "Click 'Reveal' to see your seed phrase" : "Klicken Sie auf 'Anzeigen'"}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full text-xs"
                    onClick={() => copyToClipboard(wallet.mnemonic, "seed")}
                  >
                    {copied === "seed" ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                    {en ? "Copy Seed Phrase" : "Seed-Phrase kopieren"}
                  </Button>
                </CardContent>
              </Card>

              {/* Private Key */}
              <Card className="border-red-500/30 bg-card/80 backdrop-blur">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-red-400 font-medium">{en ? "Private Key" : "Privater Schlussel"}</p>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {showKey ? (en ? "Hide" : "Verbergen") : (en ? "Reveal" : "Anzeigen")}
                    </Button>
                  </div>
                  <code className="text-xs block bg-muted/50 rounded p-2 break-all font-mono text-foreground">
                    {showKey ? wallet.privateKey : "************************************************************"}
                  </code>
                </CardContent>
              </Card>

              <Button onClick={() => setStep("confirm-seed")} className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold">
                {en ? "I Saved It - Continue" : "Gespeichert - Weiter"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Confirm Seed */}
          {step === "confirm-seed" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Lock className="w-12 h-12 text-[#D4A537] mx-auto" />
                <h2 className="text-xl font-bold text-foreground">
                  {en ? "Confirm Your Seed Phrase" : "Bestatigen Sie Ihre Seed-Phrase"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {en ? "Type all 12 words in order to verify." : "Geben Sie alle 12 Worter der Reihe nach ein."}
                </p>
              </div>
              <textarea
                className="w-full h-32 bg-muted/50 border border-[#D4A537]/20 rounded-lg p-3 text-sm font-mono text-foreground resize-none focus:outline-none focus:border-[#D4A537]"
                placeholder={en ? "word1 word2 word3 ..." : "wort1 wort2 wort3 ..."}
                value={seedConfirmation}
                onChange={(e) => setSeedConfirmation(e.target.value)}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button onClick={handleConfirmSeed} className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold">
                {en ? "Verify & Continue" : "Uberprufen & Weiter"}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("create")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {en ? "Go Back" : "Zuruck"}
              </Button>
            </div>
          )}

          {/* Set Password */}
          {step === "set-password" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Lock className="w-12 h-12 text-[#D4A537] mx-auto" />
                <h2 className="text-xl font-bold text-foreground">
                  {en ? "Set Your Password" : "Passwort festlegen"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {en ? "This encrypts your private key locally." : "Dies verschlusselt Ihren privaten Schlussel lokal."}
                </p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={en ? "Password (min. 8 characters)" : "Passwort (mind. 8 Zeichen)"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-[#D4A537]/20 pr-10"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Input
                  type="password"
                  placeholder={en ? "Confirm Password" : "Passwort bestatigen"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-muted/50 border-[#D4A537]/20"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button
                onClick={handleSetPassword}
                disabled={isProcessing}
                className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {en ? "Encrypt & Download Backup" : "Verschlusseln & Backup herunterladen"}
              </Button>
            </div>
          )}

          {/* Import via Private Key */}
          {step === "import-key" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <FileKey className="w-12 h-12 text-[#D4A537] mx-auto" />
                <h2 className="text-xl font-bold">{en ? "Import Private Key" : "Privaten Schlussel importieren"}</h2>
              </div>
              <Input
                type="password"
                placeholder={en ? "Enter your private key (0x...)" : "Geben Sie Ihren privaten Schlussel ein"}
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                className="h-12 bg-muted/50 border-[#D4A537]/20 font-mono text-sm"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button onClick={handleImportKey} className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold">
                {en ? "Import Wallet" : "Wallet importieren"}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setStep("choose"); setError("") }}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {en ? "Back" : "Zuruck"}
              </Button>
            </div>
          )}

          {/* Import via Seed */}
          {step === "import-seed" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Import className="w-12 h-12 text-[#D4A537] mx-auto" />
                <h2 className="text-xl font-bold">{en ? "Import Seed Phrase" : "Seed-Phrase importieren"}</h2>
              </div>
              <textarea
                className="w-full h-32 bg-muted/50 border border-[#D4A537]/20 rounded-lg p-3 text-sm font-mono text-foreground resize-none focus:outline-none focus:border-[#D4A537]"
                placeholder={en ? "Enter your 12 or 24 word seed phrase..." : "Geben Sie Ihre 12 oder 24 Worter ein..."}
                value={importSeed}
                onChange={(e) => setImportSeed(e.target.value)}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button onClick={handleImportSeed} className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold">
                {en ? "Import Wallet" : "Wallet importieren"}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setStep("choose"); setError("") }}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {en ? "Back" : "Zuruck"}
              </Button>
            </div>
          )}

          {/* Complete */}
          {step === "complete" && wallet && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-2">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {en ? "Wallet Created!" : "Wallet erstellt!"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {en
                  ? "Your encrypted backup has been downloaded. Keep it safe."
                  : "Ihr verschlusseltes Backup wurde heruntergeladen. Bewahren Sie es sicher auf."}
              </p>
              <Card className="border-[#D4A537]/20 bg-card/80 backdrop-blur text-left">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">{en ? "Wallet Address" : "Wallet-Adresse"}</p>
                  <code className="text-xs text-foreground break-all">{wallet.address}</code>
                </CardContent>
              </Card>
              <Link href="/dashboard">
                <Button className="w-full h-12 bg-[#D4A537] hover:bg-[#B8912E] text-black font-semibold">
                  {en ? "Go to Dashboard" : "Zum Dashboard"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

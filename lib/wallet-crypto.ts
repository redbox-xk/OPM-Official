// Non-custodial wallet creation and encryption utilities
// All crypto operations happen client-side - private keys never leave the browser

import { ethers } from "ethers"

export interface WalletData {
  address: string
  encryptedKey: string
  mnemonic?: string
}

export interface CreatedWallet {
  address: string
  privateKey: string
  mnemonic: string
}

// Generate a new wallet with BIP39 mnemonic
export function createWallet(): CreatedWallet {
  const wallet = ethers.Wallet.createRandom()
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
  }
}

// Import wallet from private key
export function importFromPrivateKey(privateKey: string): { address: string; privateKey: string } {
  const wallet = new ethers.Wallet(privateKey)
  return { address: wallet.address, privateKey: wallet.privateKey }
}

// Import wallet from mnemonic seed phrase
export function importFromMnemonic(mnemonic: string): CreatedWallet {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim())
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || mnemonic,
  }
}

// Encrypt private key with AES using user password (client-side only)
export async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(privateKey))
  const result = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  }
  return btoa(JSON.stringify(result))
}

// Decrypt private key with user password (client-side only)
export async function decryptPrivateKey(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const parsed = JSON.parse(atob(encryptedData))
  const salt = new Uint8Array(parsed.salt)
  const iv = new Uint8Array(parsed.iv)
  const data = new Uint8Array(parsed.data)
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  )
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  return decoder.decode(decrypted)
}

// Generate encrypted JSON backup file
export function generateBackupJSON(address: string, encryptedKey: string): string {
  const backup = {
    version: 1,
    platform: "OnePremium",
    address,
    encryptedKey,
    createdAt: new Date().toISOString(),
    warning: "This file contains your encrypted wallet. Keep it safe and never share your password.",
  }
  return JSON.stringify(backup, null, 2)
}

// Download backup as file
export function downloadBackup(address: string, encryptedKey: string) {
  const json = generateBackupJSON(address, encryptedKey)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `opm-wallet-${address.slice(0, 8)}-backup.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address)
}

// Validate mnemonic
export function isValidMnemonic(mnemonic: string): boolean {
  try {
    ethers.Wallet.fromPhrase(mnemonic.trim())
    return true
  } catch {
    return false
  }
}

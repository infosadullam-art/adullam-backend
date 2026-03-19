import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 12

export class SecurityService {
  // Hashage du mot de passe
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  // Vérification du mot de passe
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Génération de code de vérification à 6 chiffres
  static generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  // Validation du mot de passe (force)
  static validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: "Minimum 8 caractères" }
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Au moins une majuscule" }
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Au moins un chiffre" }
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: "Au moins un caractère spécial" }
    }
    
    const commonPasswords = ["password123", "12345678", "azerty123", "qwerty123"]
    if (commonPasswords.includes(password.toLowerCase())) {
      return { valid: false, message: "Mot de passe trop commun" }
    }
    
    return { valid: true, message: "OK" }
  }

  // Rate limiting simple (en mémoire)
  private static rateLimitStore = new Map<string, { count: number; resetAt: number }>()

  static checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.rateLimitStore.get(key)

    if (!record || now > record.resetAt) {
      this.rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    this.rateLimitStore.set(key, record)
    return true
  }

  static cleanRateLimit(): void {
    const now = Date.now()
    for (const [key, record] of this.rateLimitStore.entries()) {
      if (now > record.resetAt) {
        this.rateLimitStore.delete(key)
      }
    }
  }
}

setInterval(() => SecurityService.cleanRateLimit(), 60 * 60 * 1000)
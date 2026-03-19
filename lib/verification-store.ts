interface VerificationData {
  code: string
  method: "email" | "phone"
  expiresAt: Date
  attempts: number
  verified?: boolean
  verifiedAt?: Date
}

class VerificationStore {
  private store = new Map<string, VerificationData>()

  set(key: string, data: VerificationData): void {
    this.store.set(key, data)
    setTimeout(() => {
      this.store.delete(key)
    }, Math.max(0, data.expiresAt.getTime() - Date.now()))
  }

  get(key: string): VerificationData | undefined {
    const data = this.store.get(key)
    if (data && new Date() > data.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return data
  }

  delete(key: string): void {
    this.store.delete(key)
  }
}

export const verificationStore = new VerificationStore()
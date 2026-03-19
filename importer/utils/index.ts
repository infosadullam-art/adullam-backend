// ============================================================
// Utility functions for Adullam Import Pipeline
// ============================================================

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Parse weight from various string/number formats -> kg
 */
export function parseWeight(raw: unknown): number | null {
  if (!raw) return null;
  const str = String(raw).toLowerCase().trim();

  // Extract number
  const match = str.match(/([\d.]+)\s*(kg|g|lb|lbs|oz|gram|grams|kilogram|kilograms)?/);
  if (!match) return null;

  let value = parseFloat(match[1]);
  if (isNaN(value) || value <= 0) return null;

  const unit = match[2] || "kg";

  // Convert to kg
  switch (unit) {
    case "g":
    case "gram":
    case "grams":
      value = value / 1000;
      break;
    case "lb":
    case "lbs":
      value = value * 0.453592;
      break;
    case "oz":
      value = value * 0.0283495;
      break;
    case "kg":
    case "kilogram":
    case "kilograms":
    default:
      break;
  }

  return Math.round(value * 1000) / 1000;
}

/**
 * Parse volume from various string/number formats -> m3
 */
export function parseVolume(raw: unknown): number | null {
  if (!raw) return null;
  const str = String(raw).toLowerCase().trim();

  const match = str.match(/([\d.]+)\s*(m3|cm3|l|ml|cbm)?/);
  if (!match) return null;

  let value = parseFloat(match[1]);
  if (isNaN(value) || value <= 0) return null;

  const unit = match[2] || "m3";

  switch (unit) {
    case "cm3":
      value = value / 1000000;
      break;
    case "l":
      value = value / 1000;
      break;
    case "ml":
      value = value / 1000000;
      break;
    case "cbm":
    case "m3":
    default:
      break;
  }

  return Math.round(value * 1000000) / 1000000;
}

/**
 * Parse price string -> number
 */
export function parsePrice(raw: unknown): number | null {
  if (!raw) return null;
  let str = String(raw).trim();
  str = str.replace(/[^0-9.\-]/g, "");

  // If range "7.5-8.3", take minimum
  if (str.includes("-")) {
    str = str.split("-")[0];
  }

  const value = parseFloat(str);
  return isNaN(value) || value < 0 ? null : value;
}

/**
 * Clean and deduplicate image URLs
 */
export function cleanImages(images: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const img of images) {
    if (!img) continue;
    let url = img.trim();

    // Ensure https
    if (url.startsWith("//")) {
      url = `https:${url}`;
    }

    // Skip data URIs and invalid URLs
    if (url.startsWith("data:") || url.length < 10) continue;

    // Validate URL format
    try {
      new URL(url);
    } catch {
      continue;
    }

    // Deduplicate
    const normalized = url.split("?")[0].toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(url);
    }
  }

  return cleaned;
}

/**
 * Generate a SKU code
 */
export function generateSku(prefix: string, id: string): string {
  const hash = id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${hash}-${ts}`;
}

/**
 * Generate a URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
}

/**
 * Apply profit margin to supplier price
 */
export function applyMargin(supplierPrice: number, marginPercent: number): number {
  return Math.round(supplierPrice * (1 + marginPercent / 100) * 100) / 100;
}

/**
 * Clean HTML tags from description
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate SEO keywords from title/description
 */
export function extractKeywords(title: string, description?: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "can", "shall", "this", "that",
    "these", "those", "it", "its", "not", "no", "nor", "so", "if", "as",
    "new", "hot", "sale", "free", "shipping", "pcs", "lot", "set",
  ]);

  const text = `${title} ${description || ""}`.toLowerCase();
  const words = text.match(/[a-z]{3,}/g) || [];

  const wordCount = new Map<string, number>();
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  return [...wordCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

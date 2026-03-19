const API_BASE = "/api"

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    credentials: "include",
  })

  const contentType = response.headers.get("content-type")

  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(text || `Server error: ${response.status}`)
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "API request failed")
  }

  return data
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient<{ success: boolean; data: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    apiClient<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),
  me: () => apiClient<{ success: boolean; data: unknown }>("/auth/me"),
}

// Dashboard - CORRIGÉ !!!
export const dashboardApi = {
  getStats: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    apiClient<{ success: boolean; data: unknown }>("/admin/dashboard", {
      params: params,
    }),
}

// Products
export const productsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/products", { params }),
  get: (id: string) => apiClient<{ success: boolean; data: unknown }>(`/products/${id}`),
  create: (data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/products/${id}`, {
      method: "DELETE",
    }),
  stats: () => apiClient<{ success: boolean; data: unknown }>("/products/stats"),
}

// Categories
export const categoriesApi = {
  list: () => apiClient<{ success: boolean; data: unknown[] }>("/categories"),
  create: (data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/categories/${id}`, {
      method: "DELETE",
    }),
}

// Orders
export const ordersApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/orders", { params }),
  get: (id: string) => apiClient<{ success: boolean; data: unknown }>(`/orders/${id}`),
  updateStatus: (id: string, data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  stats: (startDate?: string, endDate?: string) =>
    apiClient<{ success: boolean; data: unknown }>("/orders/stats", {
      params: { startDate, endDate },
    }),
}

// Import
export const importApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/import", { params }),
  get: (id: string) => apiClient<{ success: boolean; data: unknown }>(`/import/${id}`),
  create: (data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>("/import", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  stats: () => apiClient<{ success: boolean; data: unknown }>("/import/stats"),
}

// Jobs
export const jobsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/jobs", { params }),
  trigger: (queue: string, job: string, payload?: unknown) =>
    apiClient<{ success: boolean; data: unknown }>("/jobs/trigger", {
      method: "POST",
      body: JSON.stringify({ queue, job, payload }),
    }),
  stats: () => apiClient<{ success: boolean; data: unknown }>("/jobs/stats"),
}

// Notifications
export const notificationsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/notifications", { params }),
  stats: () => apiClient<{ success: boolean; data: unknown }>("/notifications/stats"),
}

// Ads
export const adsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/ads", { params }),
  performance: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown }>("/ads/performance", { params }),
}

// Feed
export const feedApi = {
  stats: () => apiClient<{ success: boolean; data: unknown }>("/feed/stats"),
}

// Interactions
export const interactionsApi = {
  stats: (startDate?: string, endDate?: string) =>
    apiClient<{ success: boolean; data: unknown }>("/interactions/stats", {
      params: { startDate, endDate },
    }),
}

// Videos
export const videosApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<{ success: boolean; data: unknown[]; meta: unknown }>("/videos", { params }),
  create: (data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>("/videos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiClient<{ success: boolean; data: unknown }>(`/videos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/videos/${id}`, {
      method: "DELETE",
    }),
}
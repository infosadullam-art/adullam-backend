export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

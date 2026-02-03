"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BestDealBanner } from "@/components/price-compare/best-deal-banner"
import { ProductCard } from "@/components/price-compare/product-card"
import { Empty } from "@/components/ui/empty"
import type { ProductEntry, Platform } from "@/components/price-compare/price-compare-types"
import { ChevronDown, Bell, Settings, User, TrendingUp, ArrowRight } from "lucide-react"

async function postAggregate(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

function parseNumberLikePrice(input: unknown): number | undefined {
  if (typeof input === "number") return input
  if (typeof input !== "string") return undefined
  const cleaned = input.replace(/[^\d.]/g, "")
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : undefined
}

function normalizeProduct(partial: any, platform: Platform): ProductEntry {
  const price = parseNumberLikePrice(partial.price ?? partial.currentPrice ?? partial.finalPrice)
  const mrp = parseNumberLikePrice(partial.mrp ?? partial.originalPrice)
  return {
    platform,
    title: partial.title || partial.name || "Untitled Product",
    image: partial.image || partial.imageUrl || "/modern-tech-product.png",
    price: price ?? 0,
    mrp,
    discount: typeof partial.discount === "number" ? partial.discount : undefined,
    rating: typeof partial.rating === "number" ? partial.rating : partial.rating?.stars,
    totalReviews: partial.rating?.totalReviews || partial.rating?.totalRatings,
    topOffers: Array.isArray(partial.topOffers) ? partial.topOffers.slice(0, 3) : [],
    availability: partial.availability || partial.stock || "in-stock",
    productLink: partial.productLink || partial.url || "#",
  }
}

function normalizeAggregateResponse(payload: any): ProductEntry[] {
  if (payload?.success && payload?.sources) {
    const out: ProductEntry[] = []
    Object.keys(payload.sources).forEach((platformKey) => {
      const source = payload.sources[platformKey]
      if (source?.success && source?.data) {
        const map: Record<string, Platform> = {
          amazon: "amazon",
          flipkart: "flipkart",
          relianceDigital: "reliance",
          myntra: "myntra",
        }
        const plat = map[platformKey] || "amazon"
        out.push(normalizeProduct(source.data, plat))
      }
    })
    return out
  }
  return []
}

export default function DashboardPage() {
  const { isAuthenticated, token, user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<Array<{ _id: string; query: string; mode: string }>>([])
  const [results, setResults] = useState<Record<string, ProductEntry[]>>({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }
    ;(async () => {
      try {
        const resp = await fetch("/api/history", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || "Failed to load history")
        setHistory((data.data || []).slice(0, 8))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isAuthenticated, token, router])

  useEffect(() => {
    const fetchPrices = async () => {
      for (const h of history) {
        try {
          const body = h.mode === "link" ? { link: h.query } : { productName: h.query }
          const data = await postAggregate("/api/aggregate", { arg: body })
          setResults((prev) => ({ ...prev, [h._id]: normalizeAggregateResponse(data) }))
        } catch {}
      }
    }
    if (history.length) fetchPrices()
  }, [history])

  if (!isAuthenticated) return null

  return (
    <main className="min-h-screen relative">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">PriceCompare</span>
              <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Dashboard</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Compare Prices
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium text-gray-900 hidden lg:block">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-lg text-gray-600">Your recent searches and today's prices</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : history.length === 0 ? (
            <Card className="p-12 rounded-2xl border border-gray-200 bg-white">
              <Empty
                className="border-0"
                icon="/search-icon.png"
                title="No recent searches yet"
                description="Start tracking products to see price changes over time"
              />
              <div className="mt-8 text-center">
                <Button
                  onClick={() => router.push("/")}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-md hover:shadow-lg transition-all"
                >
                  Search Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {history.map((h) => {
                const items = results[h._id] || []
                const best =
                  items.length
                    ? items.reduce(
                        (min, p) =>
                          p.price && p.price < (min?.price ?? Number.MAX_SAFE_INTEGER) ? p : min,
                        items[0],
                      )
                    : null
                return (
                  <Card key={h._id} className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{h.query}</h3>
                        <p className="text-sm text-gray-500">
                          Searched {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="rounded-xl border-gray-300"
                      >
                        Search again
                      </Button>
                    </div>
                    {best ? (
                      <div className="mb-6">
                        <BestDealBanner best={best} />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl">
                        Fetching today's prices...
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((p) => (
                        <ProductCard key={p.platform} product={p} />
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

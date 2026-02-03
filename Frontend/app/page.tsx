"use client"

import { useState, useMemo, useEffect } from "react"
import useSWRMutation from "swr/mutation"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/price-compare/product-card"
import { BestDealBanner } from "@/components/price-compare/best-deal-banner"
import { SearchInput } from "@/components/price-compare/search-input"
import { SkeletonCard } from "@/components/price-compare/skeleton-card"
import { ScrapingLoader } from "@/components/price-compare/scraping-loader"
import { Empty } from "@/components/ui/empty"
import type { AggregateResponse, Platform, ProductEntry } from "@/components/price-compare/price-compare-types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { Bookmark, BookmarkCheck, LogIn, TrendingUp, ChevronDown, Bell, Settings, User } from "lucide-react"
import { toast } from "sonner"

type Mode = "name" | "link"

async function postAggregate(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    let msg = "Request failed"
    try {
      msg = await res.text()
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as any
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
  
  let discount: number | undefined
  if (partial.discount !== null && partial.discount !== undefined) {
    if (typeof partial.discount === "number") {
      discount = partial.discount
    } else if (typeof partial.discount === "string") {
      const discountMatch = partial.discount.match(/(\d+)%/)
      if (discountMatch) {
        discount = Number(discountMatch[1])
      }
    }
  }

  let rating: number | undefined
  let totalReviews: number | undefined
  
  if (partial.rating && partial.rating !== null) {
    if (typeof partial.rating === "object") {
      rating = partial.rating.stars || undefined
      totalReviews = partial.rating.totalReviews || partial.rating.totalRatings || undefined
    } else if (typeof partial.rating === "number") {
      rating = partial.rating
    } else if (typeof partial.rating === "string") {
      rating = Number(partial.rating)
    }
  }

  return {
    platform,
    title: partial.title || partial.name || "Untitled Product",
    image: partial.image || partial.imageUrl || "/modern-tech-product.png",
    price: price ?? 0,
    mrp: mrp,
    discount: discount,
    rating: rating,
    totalReviews: totalReviews,
    topOffers: Array.isArray(partial.topOffers) ? partial.topOffers.slice(0, 3) : [],
    availability: partial.availability || partial.stock || "in-stock",
    productLink: partial.productLink || partial.url || (platform === 'myntra' ? 'https://www.myntra.com' : "#"),
  }
}

function normalizeAggregateResponse(payload: any): ProductEntry[] {
  if (!payload) return []
  
  if (payload.success && payload.sources) {
    const out: ProductEntry[] = []
    Object.keys(payload.sources).forEach((platformKey) => {
      const source = payload.sources[platformKey]
      if (source?.success && source?.data) {
        const map: Record<string, Platform> = { amazon: "amazon", flipkart: "flipkart", relianceDigital: "reliance", myntra: "myntra" }
        const plat = map[platformKey] || "amazon"
        out.push(normalizeProduct(source.data, plat))
      }
    })
    return out
  }
  
  return []
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("name")
  const [input, setInput] = useState("")
  const [trackingProduct, setTrackingProduct] = useState(false)
  const router = useRouter()
  const { isAuthenticated, user, token, logout } = useAuth()

  const { trigger, data, isMutating, error } = useSWRMutation("/api/aggregate", postAggregate)

  const products: ProductEntry[] = useMemo(() => {
    const normalized = normalizeAggregateResponse(data as AggregateResponse)
    return normalized
  }, [data])

  const bestDeal = useMemo(() => {
    if (!products.length) return null
    return products.reduce(
      (min, p) => (p.price && p.price < (min?.price ?? Number.MAX_SAFE_INTEGER) ? p : min),
      products[0],
    )
  }, [products])

  const onSubmit = async () => {
    if (!input.trim()) return
    const payload = mode === "link" ? { link: input.trim() } : { productName: input.trim() }
    await trigger(payload)
  }

  const handleTrackProduct = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to track products")
      router.push("/auth")
      return
    }

    if (!products.length || !input.trim()) {
      toast.error("Please search for a product first")
      return
    }

    setTrackingProduct(true)
    try {
      const productName = mode === "link" ? products[0]?.title || input : input
      const platforms: Record<string, any> = {}

      products.forEach((product) => {
        platforms[product.platform] = {
          price: product.price,
          mrp: product.mrp,
          discount: product.discount,
          rating: product.rating,
          productLink: product.productLink,
          imageUrl: product.image,
          lastUpdated: new Date(),
        }
      })

      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          originalLink: mode === "link" ? input : undefined,
          platforms,
          notifyByEmail: true,
          notifyByWhatsApp: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to track product")
      toast.success("Product added to tracking!")
      router.push("/tracks")
    } catch (err: any) {
      toast.error(err.message || "Failed to track product")
    } finally {
      setTrackingProduct(false)
    }
  }

  useEffect(() => {
    const save = async () => {
      try {
        if (!isAuthenticated) return
        if (!data?.success) return
        const sources = (data as any).sources || {}
        const query = mode === "link" ? input.trim() : input.trim()
        if (!query) return
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query, mode, sources }),
        })
      } catch {}
    }
    save()
  }, [data, isAuthenticated, token, mode, input])

  return (
    <main className="min-h-screen relative">
      {/* Modern Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">PriceCompare</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                Solutions <ChevronDown className="h-3 w-3" />
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                Features <ChevronDown className="h-3 w-3" />
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1">
                Resources <ChevronDown className="h-3 w-3" />
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/tracks")}
                    className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <TrendingUp className="h-4 w-4" />
                    My Tracks
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 hidden lg:block">{user?.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout()
                        toast.success("Logged out successfully")
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/auth")}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Log in
                  </Button>
                  <Button
                    onClick={() => router.push("/auth")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
              <span className="mr-1.5">✨</span>
              PRICE COMPARISON
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Find the Best Deals
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Across All Platforms
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Compare prices from Amazon, Flipkart, Myntra, and Reliance Digital in real-time. 
            Make smarter purchasing decisions with comprehensive price insights.
          </p>

          {/* Search Card */}
          <Card className="p-8 rounded-2xl border border-gray-200 shadow-xl bg-white/90 backdrop-blur-sm">
            <SearchInput
              mode={mode}
              onModeChange={setMode}
              value={input}
              onChange={setInput}
              onSubmit={onSubmit}
              loading={isMutating}
            />
            
            {/* Loader appears here */}
            {isMutating && <ScrapingLoader />}
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="relative px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {error && (
            <Alert variant="destructive" className="mb-8 rounded-xl border-red-200">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error.message || "Failed to fetch results."}</AlertDescription>
            </Alert>
          )}

          {isMutating && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!isMutating && products.length > 0 && (
            <>
              {bestDeal && (
                <div className="mb-8">
                  <BestDealBanner best={bestDeal} />
                </div>
              )}
              
              {isAuthenticated && (
                <div className="mb-6">
                  <Button
                    onClick={handleTrackProduct}
                    disabled={trackingProduct}
                    className="w-full md:w-auto px-8 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {trackingProduct ? (
                      <>
                        <BookmarkCheck className="h-5 w-5 mr-2 animate-pulse" />
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-5 w-5 mr-2" />
                        Track This Product
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.platform} product={p} />
                ))}
              </div>
            </>
          )}

          {!isMutating && !products.length && !error && (
            <div className="mt-16">
              <Empty
                className="border-0"
                icon="/search-icon.png"
                title="Start Comparing Prices"
                description="Enter a product link or name above to see prices across all platforms."
              />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

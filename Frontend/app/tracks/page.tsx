"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, ExternalLink, TrendingDown, TrendingUp, Bell } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface TrackedProduct {
  _id: string
  productName: string
  originalLink?: string
  imageUrl?: string
  platforms: Record<string, {
    price: number
    mrp?: number
    discount?: number
    rating?: number
    productLink: string
    imageUrl?: string
    lastUpdated: string
  }>
  lowestPrice: number
  lowestPricePlatform: string
  trackingEnabled: boolean
  notifyByEmail: boolean
  notifyByWhatsApp: boolean
  createdAt: string
  updatedAt: string
}

export default function TracksPage() {
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    fetchTrackedProducts()
  }, [isAuthenticated])

  const fetchTrackedProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tracking", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to fetch tracked products")
      }

      const data = await res.json()
      setTrackedProducts(data.data || [])
    } catch (err: any) {
      setError(err.message)
      toast.error("Failed to load tracked products")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracked product?")) {
      return
    }

    try {
      const res = await fetch(`/api/tracking?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to delete tracked product")
      }

      toast.success("Product removed from tracking")
      fetchTrackedProducts()
    } catch (err: any) {
      toast.error("Failed to delete product")
    }
  }

  const formatPrice = (price?: number) => {
    if (!price || price === Number.MAX_SAFE_INTEGER) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPriceChange = (currentPrice: number, previousPrice: number) => {
    const change = ((currentPrice - previousPrice) / previousPrice) * 100
    return change
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="h-8 w-8 rounded-md" style={{ background: "oklch(0.46 0.09 258)" }} aria-hidden />
            </Link>
            <Link href="/">
              <span className="text-xl font-semibold tracking-tight">PriceCompare</span>
            </Link>
            <Badge variant="secondary" className="ml-2">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>
              Compare Prices
            </Button>
            <Button variant="outline" onClick={() => router.push("/auth")}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tracked Products</h1>
          <p className="text-muted-foreground">
            Monitor price changes and get notified when prices drop
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : trackedProducts.length === 0 ? (
          <div className="mt-20">
            <Empty
              className="border"
              icon="/search-icon.png"
              title="No tracked products"
              description="Start tracking products to see price changes over time"
            />
            <div className="mt-8 text-center">
              <Button onClick={() => router.push("/")}>
                Search Products
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trackedProducts.map((product) => (
              <Card key={product._id} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-24 h-24 object-contain rounded-xl border border-gray-200 bg-white"
                        onError={(e) => {
                          e.currentTarget.src = '/modern-tech-product.png'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 truncate">{product.productName}</h3>
                    <div className="flex items-center gap-2">
                      {product.trackingEnabled && (
                        <Badge variant="secondary">
                          <Bell className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {product.notifyByEmail && (
                        <Badge variant="outline">Email</Badge>
                      )}
                      {product.notifyByWhatsApp && (
                        <Badge variant="outline">WhatsApp</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product._id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {Object.entries(product.platforms).map(([platform, data]) => (
                    <div
                      key={platform}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium capitalize mb-1">{platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(data.price)}
                          {data.mrp && data.mrp > data.price && (
                            <span className="ml-2 line-through text-xs">
                              {formatPrice(data.mrp)}
                            </span>
                          )}
                        </div>
                        {data.discount && (
                          <Badge variant="destructive" className="mt-1">
                            {data.discount}% off
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={data.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Best Deal:</span>
                    <span className="font-semibold capitalize">
                      {product.lowestPricePlatform} - {formatPrice(product.lowestPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="text-xs">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}


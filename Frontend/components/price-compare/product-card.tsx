"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react"
import type { ProductEntry } from "./price-compare-types"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function formatPrice(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "—"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

function PlatformBadge({ platform }: { platform: ProductEntry["platform"] }) {
  const config = {
    amazon: { label: "Amazon", color: "#FF9900", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    flipkart: { label: "Flipkart", color: "#F7CA00", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    reliance: { label: "Reliance", color: "#0072BC", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    myntra: { label: "Myntra", color: "#FF6B6B", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  }
  const { label, bg, text, border } = config[platform] || config.amazon

  return (
    <Badge className={cn("px-3 py-1 rounded-full text-xs font-semibold border", bg, text, border)}>
      {label}
    </Badge>
  )
}

function Rating({ rating, total }: { rating?: number; total?: number }) {
  const r = Math.max(0, Math.min(5, Math.round((rating ?? 0) * 2) / 2))
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.floor(r)
          const half = !filled && i + 0.5 === r
          return (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                filled || half ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              )}
            />
          )
        })}
      </div>
      {typeof rating === "number" && (
        <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
      )}
      {typeof total === "number" && (
        <span className="text-xs text-gray-500">({total.toLocaleString("en-IN")})</span>
      )}
    </div>
  )
}

export function ProductCard({ product }: { product: ProductEntry }) {
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const hasDiscount = typeof product.discount === "number" && product.discount > 0
  const hasMrp = typeof product.mrp === "number" && product.mrp > (product.price ?? 0)

  const onTrack = async () => {
    try {
      if (!isAuthenticated) {
        toast.error("Please login to track products")
        router.push("/auth")
        return
      }
      setSaving(true)
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: product.title,
          originalLink: product.productLink,
          platforms: {
            [product.platform]: {
              price: product.price,
              mrp: product.mrp,
              discount: product.discount,
              rating: product.rating,
              productLink: product.productLink,
              imageUrl: product.image,
              lastUpdated: new Date(),
            },
          },
          notifyByEmail: true,
          notifyByWhatsApp: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to track product")
      toast.success("Product added to tracking")
    } catch (e: any) {
      toast.error(e?.message || "Failed to track product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="group p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <PlatformBadge platform={product.platform} />
        {hasDiscount && (
          <Badge className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-semibold border-0">
            {Math.round(product.discount!)}% OFF
          </Badge>
        )}
      </div>

      {/* Product Image */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 mb-4 flex items-center justify-center">
        <img
          src={product.image || "/placeholder.svg?height=400&width=400"}
          alt={product.title || "Product image"}
          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          crossOrigin="anonymous"
        />
      </div>

      {/* Product Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug min-h-[3rem]">
        {product.title}
      </h3>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
          {hasMrp && (
            <span className="text-lg text-gray-400 line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>
      </div>

      {/* Rating and Availability */}
      <div className="flex items-center justify-between mb-4">
        <Rating rating={product.rating} total={product.totalReviews} />
        <span
          className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            product.availability === "in-stock"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {product.availability || "in-stock"}
        </span>
      </div>

      {/* Offers */}
      {product.topOffers && product.topOffers.length > 0 && (
        <div className="mb-4 space-y-2">
          {product.topOffers.slice(0, 2).map((offer, i) => (
            <div key={i} className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg line-clamp-1">
              🎁 {offer}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-4 space-y-2">
        <Button
          asChild
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all"
        >
          <a href={product.productLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
            View on {product.platform.charAt(0).toUpperCase() + product.platform.slice(1)}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={onTrack}
          disabled={saving}
          className="w-full rounded-xl border-gray-300 hover:bg-gray-50 transition-all"
        >
          {saving ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-2 animate-pulse" />
              Tracking...
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Track Price
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

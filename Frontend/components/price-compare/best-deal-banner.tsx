"use client"

import { Trophy } from "lucide-react"
import type { ProductEntry } from "./price-compare-types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatPrice(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "—"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

export function BestDealBanner({ best }: { best: ProductEntry }) {
  const config = {
    amazon: { label: "Amazon", color: "#FF9900", bg: "bg-orange-500" },
    flipkart: { label: "Flipkart", color: "#F7CA00", bg: "bg-yellow-500" },
    reliance: { label: "Reliance", color: "#0072BC", bg: "bg-blue-600" },
    myntra: { label: "Myntra", color: "#FF6B6B", bg: "bg-pink-500" },
  }
  const { label, bg } = config[best.platform] || config.amazon

  return (
    <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className={`h-14 w-14 rounded-xl ${bg} flex items-center justify-center shadow-md`}>
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="px-2.5 py-1 bg-blue-600 text-white border-0 text-xs font-semibold">
              Best Deal
            </Badge>
            <span className="text-sm text-gray-600">Found on {label}</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            Lowest Price: <span className="text-blue-600">{formatPrice(best.price)}</span>
          </div>
        </div>
        <Button
          asChild
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all px-6"
        >
          <a href={best.productLink} target="_blank" rel="noreferrer">
            Get this deal
          </a>
        </Button>
      </div>
    </Card>
  )
}

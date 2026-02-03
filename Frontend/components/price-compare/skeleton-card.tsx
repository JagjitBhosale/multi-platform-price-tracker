import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <div className="mt-3 aspect-square overflow-hidden rounded-md">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-5/6" />
      <div className="mt-2 flex items-end gap-3">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </Card>
  )
}

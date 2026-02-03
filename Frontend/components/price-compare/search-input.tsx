"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useId } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Search } from "lucide-react"

type Props = {
  mode: "name" | "link"
  onModeChange: (m: "name" | "link") => void
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading?: boolean
  compact?: boolean
}

export function SearchInput({ mode, onModeChange, value, onChange, onSubmit, loading, compact }: Props) {
  const inputId = useId()
  return (
    <div className="w-full">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as "name" | "link")} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger 
            value="name" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
          >
            Product Name
          </TabsTrigger>
          <TabsTrigger 
            value="link"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
          >
            Product Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="name" className="mt-0">
          <label htmlFor={inputId} className="sr-only">
            Search by product name
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id={inputId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., iPhone 16, Samsung washing machine"
                className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit()
                }}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={onSubmit} 
              disabled={loading || !value.trim()}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Compare
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="link" className="mt-0">
          <label htmlFor={`${inputId}-link`} className="sr-only">
            Search by product link
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id={`${inputId}-link`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste Amazon/Flipkart/Reliance product URL"
                className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit()
                }}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={onSubmit} 
              disabled={loading || !value.trim()}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Compare
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export type Platform = "amazon" | "flipkart" | "reliance" | "myntra"

export interface ProductEntry {
  platform: Platform
  title: string
  image: string
  price: number
  mrp?: number
  discount?: number
  rating?: number
  totalReviews?: number
  topOffers?: string[]
  availability?: string
  productLink: string
}

export interface AggregateResponse {
  products: ProductEntry[]
}

export interface Plan {
  currency: string
  price: number
  period: string
  title: string
  features: string[]
  cta: string
  isFeature?: boolean
}

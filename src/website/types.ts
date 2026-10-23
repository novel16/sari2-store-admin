export interface SiteContent {
  brand: { name: string; tagline: string }
  home: {
    title: string
    description: string
    eyebrow: string
    headline: string
    intro: string
    cta_label: string
    features_title: string
    features_intro: string
    steps_title: string
    pricing_title: string
    pricing_intro: string
    faq_title: string
    final_title: string
    final_intro: string
  }
  pricing: { title: string; description: string; headline: string; intro: string }
  features: { title: string; body: string }[]
  steps: { title: string; body: string }[]
  faqs: { question: string; answer: string }[]
  sections: {
    order: ('features' | 'steps' | 'pricing' | 'faq')[]
    hidden: ('features' | 'steps' | 'pricing' | 'faq')[]
  }
  media: {
    logo_url: string | null
    hero_url: string | null
    hero_alt: string
    og_image_url: string | null
    og_image_alt: string
  }
  footer: { description: string; contact_email: string | null }
}
export interface PublicPlan {
  id: number
  code: string
  name: string
  description: string | null
  monthly_price_centavos: number
  active_product_limit: number | null
  quota_scope: 'store' | 'account'
  store_limit: number
  staff_limit: number
  catalog_status: 'published' | 'coming_soon'
  featured: boolean
}
export interface PublicSiteData {
  content: SiteContent
  plans: PublicPlan[]
  billing_available: boolean
  version: number
  revision: string
  published_at: string
  updated_at: string
}
export interface WebsiteDocument {
  version: number
  published_version: number
  published_at: string
  draft: SiteContent
  published: SiteContent
  site_url: string
}
export interface WebsiteRevision {
  id: number
  version: number
  action: string
  actor_name_snapshot: string | null
  change_note: string
  created_at: string
}

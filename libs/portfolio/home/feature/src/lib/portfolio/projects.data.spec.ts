import { PORTFOLIO_ITEMS } from './projects.data'

declare const describe: any
declare const it: any
declare const expect: any

describe('PORTFOLIO_ITEMS', () => {
  it('lists all 8 projects', () => {
    expect(PORTFOLIO_ITEMS.length).toBe(8)
  })

  it('marks exactly 3 as featured', () => {
    expect(PORTFOLIO_ITEMS.filter((p) => p.featured).length).toBe(3)
  })

  it('features Xoài, CodeMagpie and LogiChat', () => {
    const featuredUrls = PORTFOLIO_ITEMS.filter((p) => p.featured).map((p) => p.projectUrl)
    expect(featuredUrls).toEqual([
      'https://heyxoai.com',
      'https://codemagpie.com',
      'https://logichat.io',
    ])
  })

  it('gives every item the required fields', () => {
    for (const p of PORTFOLIO_ITEMS) {
      expect(typeof p.title).toBe('string')
      expect(typeof p.description).toBe('string')
      expect(p.imageUrl).toMatch(/^assets\/images\//)
      expect(p.projectUrl).toMatch(/^https:\/\//)
      expect(Array.isArray(p.technologies)).toBe(true)
    }
  })
})

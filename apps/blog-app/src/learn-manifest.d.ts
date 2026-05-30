declare module 'virtual:learn-manifest' {
  export interface LearnPage {
    title: string
    description: string
    url: string
  }
  export const learnPages: LearnPage[]
}

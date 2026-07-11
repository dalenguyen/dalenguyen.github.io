export interface PortfolioItem {
  id: number
  title: string
  description: string
  imageUrl: string
  technologies: { name: string; icon: string }[]
  projectUrl: string
  featured?: boolean
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    title: 'Xoài (Voice Assistant for Apple Watch)',
    description:
      "Your second brain on your wrist. Tap your Apple Watch, ask out loud, and Xoài speaks back a live, web-grounded answer — hands-free, eyes-free. A native watchOS assistant that captures the small questions you'd otherwise let go.",
    imageUrl: 'assets/images/home/xoai.png',
    technologies: [
      { name: 'watchOS', icon: 'watch' },
      { name: 'SwiftUI', icon: 'code' },
      { name: 'Gemini', icon: 'psychology' },
      { name: 'Google Search', icon: 'search' },
      { name: 'Sign in with Apple', icon: 'lock' },
    ],
    projectUrl: 'https://heyxoai.com',
    featured: true,
  },
  {
    id: 2,
    title: 'CodeMagpie (AI Coding Agent)',
    description:
      'A GitHub App that writes code and reviews PRs when you @mention it. Reviewer, implementer, and resolver agents share one model-agnostic backend built on the Claude Agent SDK.',
    imageUrl: 'assets/images/home/codemagpie.png',
    technologies: [
      { name: 'Claude Agent SDK', icon: 'psychology' },
      { name: 'GitHub App', icon: 'code' },
      { name: 'TypeScript', icon: 'code' },
      { name: 'Node.js', icon: 'api' },
      { name: 'Model-agnostic LLM', icon: 'psychology' },
    ],
    projectUrl: 'https://codemagpie.com',
    featured: true,
  },
  {
    id: 3,
    title: 'LogiChat (AI Chatbot)',
    description: 'Automate your customer support with the next generation natural language processing technology',
    imageUrl: 'assets/images/home/logichat.png',
    technologies: [
      { name: 'Nx', icon: 'layers' },
      { name: 'Express', icon: 'api' },
      { name: 'Angular', icon: 'code' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Stripe', icon: 'payments' },
      { name: 'CloudFlare', icon: 'security' },
      { name: 'OpenAI', icon: 'psychology' },
      { name: 'Resend', icon: 'email' },
    ],
    projectUrl: 'https://logichat.io',
    featured: true,
  },
  {
    id: 4,
    title: 'DailyMastery (Learning Platform)',
    description:
      'A comprehensive learning platform designed to help users master new skills through daily practice and structured learning paths. Built with modern web technologies to provide an engaging and effective learning experience.',
    imageUrl: 'assets/images/home/dailymastery.png',
    technologies: [
      { name: 'Next.js', icon: 'code' },
      { name: 'Nx', icon: 'layers' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'TailwindCSS', icon: 'style' },
      { name: 'GCP', icon: 'cloud' },
    ],
    projectUrl: 'https://dailymastery.io',
  },
  {
    id: 5,
    title: 'TechLeadPilot (Leadership Simulator)',
    description:
      'A leadership simulator that puts you in realistic Tech Lead scenarios before you actually have to face them. Practice soft skills like navigating office politics, motivating team members, and making decisions under pressure.',
    imageUrl: 'assets/images/blog/techleadpilot-simulator.png',
    technologies: [
      { name: 'Angular', icon: 'code' },
      { name: 'Analog.js', icon: 'code' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Vertex AI', icon: 'psychology' },
      { name: 'Firestore', icon: 'storage' },
      { name: 'Node.js', icon: 'api' },
    ],
    projectUrl: 'https://techleadpilot.com',
  },
  {
    id: 6,
    title: 'Techcater (E-Commerce Platform)',
    description:
      'A WordPress plugin marketplace offering premium extensions on a subscription model with automated license management and seamless updates.',
    imageUrl: 'assets/images/home/techcater.png',
    technologies: [
      { name: 'Angular', icon: 'code' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Stripe', icon: 'payments' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'PrimeNG', icon: 'dashboard' },
      { name: 'TailwindCSS', icon: 'style' },
      { name: 'Amplitude', icon: 'analytics' },
    ],
    projectUrl: 'https://techcater.com',
  },
  {
    id: 7,
    title: 'PDFun (Open Source PDF Services)',
    description: 'A collection of open source services for PDF processing, Password removal, PDF AI chat, and more.',
    imageUrl: 'assets/images/home/pdfun.png',
    technologies: [
      { name: 'Nx', icon: 'layers' },
      { name: 'Analog', icon: 'code' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'OpenAI', icon: 'psychology' },
      { name: 'OpenScript', icon: 'code' },
    ],
    projectUrl: 'https://pdfun.xyz',
  },
  {
    id: 8,
    title: 'SafePlate (AI Meal Planner)',
    description:
      'Generate personalized meals that avoid allergens and incorporate your favorite ingredients, promoting a healthy lifestyle with our advanced AI technology. Eat safely, live confidently.',
    imageUrl: 'assets/images/home/safeplate.png',
    technologies: [
      { name: 'Ionic', icon: 'phone_iphone' },
      { name: 'Vertex AI', icon: 'psychology' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'NestJS', icon: 'code' },
    ],
    projectUrl: 'https://safeplate.ai',
  },
]

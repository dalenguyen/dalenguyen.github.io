---
title: Building a Next.js Landing Page with Google Sheets Integration and Google Cloud Run Deployment
slug: 2025-08-20-building-nextjs-landing-page-with-google-sheets-integration-and-google-cloud-run-deployment
description: Learn how to build a modern Next.js 15 landing page that collects emails in Google Sheets and deploys seamlessly to Google Cloud Run. This comprehensive guide covers everything from setup to production deployment.
categories: ['nextjs', 'tutorial', 'webdev', 'google-cloud', 'google-sheets']
coverImage: https://dalenguyen.me/assets/images/blog/nextjs-example-landing-page.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-08-20T15:17:31.359Z
author: Dale Nguyen
---

Building a modern landing page that captures potential user emails is essential for any startup or product launch. In this comprehensive guide, I'll walk you through creating a Next.js 15 landing page that collects emails in Google Sheets and deploys seamlessly to Google Cloud Run.

## What We'll Build

By the end of this tutorial, you'll have:

- A responsive Next.js 15 landing page with TypeScript
- Email signup form with validation and loading states
- Google Sheets integration to store collected emails
- Dockerized application ready for production
- Automated deployment to Google Cloud Run
- Cost-effective, scalable infrastructure

<figure>
  <img src="assets/images/blog/workwrite-sign-up.gif" alt="Landing page example" width="100%" height="auto" />
  <figcaption>Landing page example</figcaption>
</figure>

## Prerequisites

- Node.js 20+ and pnpm installed
- Google Cloud Platform account
- Basic knowledge of React and TypeScript
- Docker installed (for local testing)

## Project Setup

### 1. Initialize the Next.js Project

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest landing --typescript --tailwind --app

cd landing
```

### 2. Install Dependencies

```bash
# Install Google APIs client
pnpm add googleapis

# Install development dependencies
pnpm add -D @types/node
```

## Building the Email Signup Component

### 1. Create the Email Signup Component

Create `src/app/components/email-signup/email-signup.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

const EmailSignup = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/v1/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Thank you for subscribing!')
        setEmail('')
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="relative py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold text-white">Stay updated with the latest</h2>
          <p className="mb-10 text-xl text-blue-100">Get the latest updates delivered to your inbox.</p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <input
              type="email"
              required
              className="flex-1 px-6 py-4 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold hover:bg-blue-50 disabled:opacity-50 transition-all"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {message && (
            <p className={`mb-6 text-lg font-medium ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default EmailSignup
```

## Google Sheets Integration

### 1. Create Google Sheets Service

Create `src/lib/google-sheets.ts`:

```typescript
import { google } from 'googleapis'

export interface EmailSignupData {
  email: string
  timestamp: string
  source?: string
}

class GoogleSheetsService {
  private auth
  private sheets

  constructor() {
    // Use Application Default Credentials (Cloud Run provides this automatically)
    this.auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async saveEmailSignup(data: EmailSignupData): Promise<void> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured')
    }

    const values = [[data.email, data.timestamp, data.source || 'landing-page']]

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      })
    } catch (error) {
      console.error('Error saving to Google Sheets:', error)
      throw error
    }
  }

  async setupSheet(): Promise<void> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured')
    }

    try {
      // Add headers if sheet is empty
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A1:C1',
      })

      if (!response.data.values || response.data.values.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sheet1!A1:C1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Email', 'Timestamp', 'Source']],
          },
        })
      }
    } catch (error) {
      console.error('Error setting up Google Sheets:', error)
      throw error
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()
```

### 2. Create API Route

Create `src/app/api/v1/email-signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '../../../../lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Save to Google Sheets
    try {
      await googleSheetsService.saveEmailSignup({
        email,
        timestamp: new Date().toISOString(),
        source: 'landing-waitlist',
      })
      console.log('Email saved to Google Sheets:', email)
    } catch (sheetsError) {
      console.error('Failed to save to Google Sheets:', sheetsError)
      // Continue with success response even if sheets fails
    }

    return NextResponse.json({ message: 'Email subscribed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Email signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Dockerization for Production

### 1. Configure Next.js for Standalone Output

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Enable compression in production
  compress: true,

  // Optimize for production
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
```

### 2. Create Dockerfile

Create `Dockerfile`:

```dockerfile
# Minimal production image for built Next.js app
FROM node:20-alpine AS production

WORKDIR /app

# Copy the standalone build (includes dependencies, server, and app)
COPY .next/standalone/ ./

# Copy static files
COPY public ./public
COPY .next/static ./.next/static

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the application files
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start the standalone server
CMD ["node", "server.js"]
```

### 3. Build and Test Locally

```bash
# Build the Next.js application
npm run build

# Build Docker image
docker build -t landing-page .

# Test locally
docker run -p 3000:3000 -e GOOGLE_SHEETS_ID=your-sheet-id landing-page
```

## Google Cloud Setup

### 1. Create Google Cloud Resources

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR-PROJECT-ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sheets.googleapis.com

# Create a service account
gcloud iam service-accounts create workwrite-sheets \
    --display-name="WorkWrite Sheets Service Account"

# Grant Google Sheets access
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
    --member="serviceAccount:workwrite-sheets@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
    --role="roles/editor"
```

### 2. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the spreadsheet ID from the URL
4. Share the sheet with your service account email

### 3. Build and Push to Google Cloud Registry

```bash
# Configure Docker to use gcloud
gcloud auth configure-docker us-central1-docker.pkg.dev

# Create Artifact Registry repository
gcloud artifacts repositories create workwrite-repo \
    --repository-format=docker \
    --location=us-central1

# Build and tag image
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing .

# Push to registry
docker push us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing
```

## Deployment to Google Cloud Run

### 1. Deploy with Cloud Run

```bash
gcloud run deploy workwrite-landing \
  --image us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account workwrite-sheets@YOUR-PROJECT-ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_SHEETS_ID=YOUR-SHEET-ID \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300
```

### 2. Automated Deployment with Scripts

Create deployment scripts in your `package.json`:

```json
{
  "scripts": {
    "docker:build": "docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing .",
    "docker:push": "docker push us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing",
    "deploy": "npm run build && npm run docker:build && npm run docker:push && gcloud run deploy workwrite-landing --image us-central1-docker.pkg.dev/YOUR-PROJECT-ID/workwrite-repo/workwrite-landing --region us-central1"
  }
}
```

## Advanced Features

### 1. Environment Variables

Create `.env.local` for development:

```bash
GOOGLE_SHEETS_ID=your-development-sheet-id
```

### 2. Error Handling and Monitoring

Add comprehensive error handling in your API routes:

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... your existing code
  } catch (error) {
    // Log error for monitoring
    console.error('Email signup error:', {
      error: error.message,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map()

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const limit = 5 // 5 requests per minute
  const windowMs = 60 * 1000 // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      lastReset: Date.now(),
    })
  }

  const user = rateLimitMap.get(ip)

  if (Date.now() - user.lastReset > windowMs) {
    user.count = 0
    user.lastReset = Date.now()
  }

  if (user.count >= limit) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  user.count += 1

  // ... rest of your code
}
```

## Performance Optimizations

### 1. Image Optimization

Add optimized images with Next.js Image component:

```tsx
import Image from 'next/image'

const Hero = () => (
  <section className="hero">
    <Image src="/hero-image.jpg" alt="Hero" width={800} height={600} priority className="rounded-lg" />
  </section>
)
```

### 2. SEO Optimization

Update `src/app/layout.tsx` with comprehensive metadata:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WorkWrite - AI-Powered Writing Platform',
  description: 'Transform your writing workflow with AI.',
  keywords: ['writing', 'AI', 'productivity'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://workwrite.com',
    title: 'WorkWrite - AI-Powered Writing Platform',
    description: 'Transform your writing workflow with AI.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WorkWrite',
      },
    ],
  },
}
```

## Cost Optimization

### 1. Cloud Run Pricing

Google Cloud Run pricing is based on:

- **CPU and Memory**: Pay per 100ms of usage
- **Requests**: $0.40 per million requests
- **Networking**: Egress charges apply

For a typical landing page:

- **Low traffic** (1K visitors/month): ~$1-2/month
- **Medium traffic** (10K visitors/month): ~$5-10/month
- **High traffic** (100K visitors/month): ~$20-40/month

### 2. Optimization Tips

```javascript
// next.config.js
const nextConfig = {
  // Compress responses
  compress: true,

  // Optimize bundle
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Cache static assets
  headers: async () => [
    {
      source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

## Monitoring and Analytics

### 1. Google Analytics

Add Google Analytics to track conversions:

```tsx
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Conversion Tracking

Track email signups:

```typescript
// Declare gtag as a global function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: {
        event_category?: string
        event_label?: string
        value?: number
        [key: string]: any
      },
    ) => void
  }
}

// In your email signup component
const trackConversion = () => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'sign_up', {
      event_category: 'engagement',
      event_label: 'email_signup',
    })
  }
}

const handleSubmit = async (e) => {
  // ... existing code

  if (response.ok) {
    trackConversion()
    // ... rest of success handling
  }
}
```

## Security Best Practices

### 1. Environment Variables

Never commit sensitive data:

```bash
# .env.local (never commit)
GOOGLE_SHEETS_ID=your-actual-sheet-id

# For production, set in Cloud Run
gcloud run services update workwrite-landing \
  --set-env-vars GOOGLE_SHEETS_ID=your-production-sheet-id
```

### 2. Input Validation

Always validate user inputs:

```typescript
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = emailSchema.parse(body)

    // ... rest of your code
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    // ... handle other errors
  }
}
```

## Testing

### 1. Component Testing

```typescript
// __tests__/email-signup.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmailSignup from '../src/app/components/email-signup/email-signup'

describe('EmailSignup', () => {
  test('submits email successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      }),
    )

    render(<EmailSignup />)

    const input = screen.getByPlaceholderText('Enter your email')
    const button = screen.getByRole('button', { name: /subscribe/i })

    fireEvent.change(input, { target: { value: 'test@example.com' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Thank you for subscribing!')).toBeInTheDocument()
    })
  })
})
```

### 2. API Testing

```typescript
// __tests__/api/email-signup.test.ts
import { POST } from '../../src/app/api/v1/email-signup/route'

describe('/api/v1/email-signup', () => {
  test('validates email format', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })
})
```

## Conclusion

You now have a complete, production-ready Next.js landing page that:

- **Collects emails** efficiently with a beautiful UI
- **Stores data** in Google Sheets automatically
- **Scales automatically** with Google Cloud Run
- **Costs minimal** for low to medium traffic
- **Performs excellently** with optimized builds
- **Monitors effectively** with built-in analytics

This setup provides a solid foundation for any product launch or marketing campaign. The combination of Next.js 15, Google Sheets, and Cloud Run offers excellent developer experience with enterprise-grade scalability and reliability.

### Next Steps

1. **Add A/B testing** for different signup copy
2. **Implement email automation** with services like SendGrid
3. **Add more landing page sections** (testimonials, features, pricing)
4. **Set up CI/CD** with GitHub Actions
5. **Add real-time analytics** dashboard

The architecture we've built is flexible and can grow with your product needs while maintaining excellent performance and cost efficiency.

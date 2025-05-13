---
title: Building EczEase with Cutting-Edge Tech - Build Landing Page
slug: 2025-03-27-building-eczease-with-cutting-edge-tech-build-landing-page
description: This innovative platform aims to transform the way people manage eczema and food allergies, leveraging the power of artificial intelligence and modern web technologies.
categories: ['angular', 'openai', 'open-source']
coverImage: https://dalenguyen.me/assets/images/blog/ezcease-hero-image.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-03-27T15:17:31.359Z
author: Dale Nguyen
series: EczEase
---

In the ever-evolving landscape of health technology, I'm thrilled to announce my latest open-source project: [EczEase](https://github.com/dalenguyen/eczease). This innovative platform aims to transform the way people manage eczema and food allergies, leveraging the power of artificial intelligence and modern web technologies. As someone who has witnessed the challenges faced by loved ones battling these conditions, I'm passionate about creating a solution that can make a real difference.

Web: https://eczeease.com
<br>
Github: https://github.com/dalenguyen/EczEase

> Looking for immediate help with allergy-friendly meal planning? Try 🍽️ **[SafePlate.ai (Beta)](https://SafePlate.ai)** - an iOS app designed to make dining safer and more enjoyable for people with food allergies.

In the article, I will share the process on how to build a landing page for the project.

## Landing Page Purpose

The landing page for EczEase serves two crucial purposes:

1. **Project Announcement**: It's the digital billboard, introducing the world to the innovative eczema and food allergy management platform. I'll showcase the key features I'm developing and the vision for revolutionizing how people manage these conditions.

2. **Email Collection**: I'm inviting interested individuals to join the journey early. By entering their email, they'll be the first to know when EczEase is ready for launch, and they may even get early access to beta features.

<figure>
  <img src="assets/images/blog/eczease-landing-page.png" alt="EczEase landing page" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>EczEase landing page</figcaption>
</figure>

## Stack to Build the Landing Page

I'm leveraging cutting-edge technologies to create a fast, responsive, and easily maintainable landing page:

### Angular (AnalogJS)

[AnalogJS](https://analogjs.org/) brings meta-framework capabilities to Angular, allowing us to build a lightning-fast, SEO-friendly landing page. Its server-side rendering capabilities ensure our content loads quickly and is easily indexable by search engines.

For the landing page, I'm trying to keep it simple, all we need is the `(home).page.ts` and `LandingPageComponent` that holds the [landing page content](https://github.com/dalenguyen/EczEase/blob/main/webapp/src/app/components/landing-page.component.ts).

```typescript
// (home).page.ts

import { Component } from '@angular/core'
import { LandingPageComponent } from '../components/landing-page.component'
import { RouteMeta } from '@analogjs/router'

// SEO configuration
export const routeMeta: RouteMeta = {
  title: 'EczEase - Your guide to eczema',

  meta: [
    { name: 'og:title', content: 'EczEase - Your guide to eczema' },
    {
      name: 'og:description',
      content:
        'EczEase is your guide to eczema. We provide personalized eczema care plans and resources to help you manage your condition.',
    },
    { name: 'og:url', content: 'https://eczease.com' },
    {
      name: 'og:image',
      content: 'https://eczease.com/assets/images/logo.webp',
    },
    { name: 'type', content: 'website' },
  ],
}

@Component({
  selector: 'webapp-home',
  imports: [LandingPageComponent],
  template: ` <webapp-landing-page /> `,
})
export default class HomeComponent {}
```

### Resend

For email notifications, we're using [Resend](https://resend.com/). This modern email API will help us reliably deliver signup confirmations and future product announcements to our interested users.

This is where Analogjs comes into place. I can have the API & the frontend logic in one place. Here is how to create the signup form and collect user emails.

Let's check out the logic on the frontend side:

```typescript
// webapp/src/app/components/landing-page.component.ts

<h3>Get Early Access</h3>
<p class="text-gray-600 mb-3 sm:mb-4">
  Join our waitlist to be the first to know when we launch.
</p>

<form (submit)="onSubmit($event)">
  <div>
    <input
      type="text"
      [(ngModel)]="name"
      name="name"
      placeholder="Enter your name"
      required
    />
  </div>
  <div>
    <input
      type="email"
      [(ngModel)]="email"
      name="email"
      placeholder="Enter your email"
      required
    />
  </div>
  <button type="submit">
</form>

...

onSubmit(event: Event) {
  ...

  this.http
    .post<{ success: boolean; message: string }>('/api/v1/newsletter', {
      name: this.name(),
      email: this.email(),
    })

}
```

From the code, we create the form, and the `onSubmit()` to handle to request to the `/api/v1/newsletter` endpoint.

Let's check the API code that handle the request:

```typescript
// webapp/src/server/routes/api/v1/newsletter.post.ts

import { defineEventHandler, readBody, H3Event } from 'h3'
import resendService from '../../services/resend.service'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Read request body
    const { name, email } = await readBody(event)

    //  validation

    // Add to Resend audience using the shared service
    const audienceResponse = await resendService.addContactToAudience(email, firstName, lastName)

    return {
      success: true,
      message: 'Successfully added to newsletter',
    }
  } catch (error) {
    //
  }
})

// webapp/src/server/routes/services/resend.service.ts

/**
 * Add a contact to a Resend audience
 * @param email - The contact's email address
 * @param firstName - The contact's first name
 * @param lastName - The contact's last name (optional)
 * @param audienceId - The ID of the audience to add the contact to (defaults to env variable)
 * @returns The response from the Resend API
 */
async addContactToAudience(
  email: string,
  firstName: string,
  lastName?: string,
  audienceId?: string
) {
  return this.resend.contacts.create({
    email,
    firstName,
    lastName,
    audienceId: audienceId ?? process.env['RESEND_AUDIENCE_ID'] ?? '',
  })
}
```

The main logic is that we extract `name` and `email` from the submitted form then use `Resend` to add contact to audience. Make sure you read the [docs](https://resend.com/docs/introduction) on how to create an account and copy Resend API key before deploying the project.

### Google Cloud Platform (GCP)

GCP provides the backbone for our backend services, offering scalability and reliability as our user base grows.

I'm deploying the landing page to Cloud Run and using Firebase Hosting for domain redirection, which offers fast content delivery, automatic SSL, and easy deployment processes.

In the next article, I will show more detail on how the deployment works.

## Summary

By creating an informative, engaging, and optimized landing page, I hope that it can help to effectively announce [EczEase](https://eczeease.com) to the world and build a community of interested users eager for our launch. This early interest will be invaluable as I continue developing our platform to revolutionize eczema and food allergy management.

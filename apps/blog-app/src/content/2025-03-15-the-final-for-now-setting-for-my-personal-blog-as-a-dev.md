---
title: The Final (For Now) Setting for My Personal Blog as a Dev
slug: 2025-03-15-the-final-for-now-setting-for-my-personal-blog-as-a-dev
description: As developers, we often find ourselves in a cycle of continuous improvement, especially when it comes to our personal projects. For me, revamping my personal blog has become a recurring theme, each iteration serving as a valuable learning experience.
categories: ['angular', 'webdev', 'portfolio']
coverImage: https://dalenguyen.me/assets/images/blog/perfonal-blog-after.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-03-15T15:17:31.359Z
author: Dale Nguyen
---

<figure>
  <img src="assets/images/blog/perfonal-blog-after.png" alt="Final improvement for my personal blog" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Final improvement for my personal blog</figcaption>
</figure>

As developers, we often find ourselves in a cycle of continuous improvement, especially when it comes to our personal projects. For me, revamping my personal blog has become a recurring theme, each iteration serving as a valuable learning experience. This latest setup marks a significant leap forward, addressing previous challenges while embracing new technologies that enhance both functionality and productivity.

## The Struggle with SPAs

Before this latest revamp, my blog was built solely with Angular as a Single Page Application (SPA). While SPAs offer a seamless user experience, they come with inherent drawbacks, particularly in terms of SEO and social sharing:

- **SEO Challenges**: SPAs rely heavily on JavaScript for dynamic content rendering, which can be problematic for search engine crawlers. Some crawlers struggle to index JavaScript-based content effectively, leading to poor visibility in search results.

<figure>
  <img src="assets/images/blog/perfonal-blog-before.png" alt="Before the improvement for my personal blog" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Before the improvement for my personal blog</figcaption>
</figure>

- **Social Sharing Issues**: When sharing SPA content on social media, the lack of distinct URLs for each page can result in incorrect metadata being displayed, affecting how your content is perceived by potential readers.

<figure>
  <img src="assets/images/blog/personal-blog-social-sharing-before.png" alt="Bad sharing experience with SPA" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Bad sharing experience with SPA</figcaption>
</figure>

## The New Setup: A Leap Forward

The latest iteration of my blog addresses these challenges by incorporating a more robust and SEO-friendly setup:

### Key Components

- **[Angular](https://angular.dev/) ([AnalogJS](https://analogjs.org/)) for SSG**: By leveraging AnalogJS, I've implemented Server-Side Rendering (SSR) and Static Site Generation (SSG) capabilities. This approach ensures that my blog posts are pre-rendered as static HTML files, significantly improving SEO by making content more accessible to search engine crawlers.

- **[Tailwind](https://tailwindcss.com/) + Material for Styling**: Combining Tailwind CSS with Material Design provides a consistent and visually appealing interface, enhancing user experience without sacrificing performance.

- **[Vercel](https://vercel.com/) for Deployment**: Vercel offers seamless deployment and hosting, ensuring fast load times and reliable uptime.

- **[Giscus](https://giscus.app/) for Comments**: Integrating giscus allows for a more personalized and developer-friendly commenting system.

- **Google Analytics**: For better insights into user behavior and engagement, Google Analytics provides valuable data to inform future improvements.

### Benefits of the New Setup

This setup offers several advantages that have significantly improved my productivity as a developer:

- **SEO Improvements**: With SSG, my blog posts are now more easily indexed by search engines, enhancing visibility and reach.

- **100% Control**: By using a custom setup, I have complete control over how each component is implemented, allowing for tailored solutions to specific needs.

- **Staying Updated with New Technologies**: This setup keeps me engaged with the latest developments in web technologies, which is invaluable for my professional growth.

<figure>
  <img src="assets/images/blog/personal-blog-social-sharing-after.png" alt="Good sharing experience with SPA" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Good sharing experience with SSG</figcaption>
</figure>

## Conclusion

While this might not be the "final" iteration of my blog, it represents a significant milestone in my journey as a developer. Each revamp is an opportunity to learn and adapt, and this setup has undoubtedly made me more productive and better equipped to tackle future projects. Whether you're a seasoned developer or just starting out, embracing change and continuous improvement is key to staying ahead in the ever-evolving world of web development.

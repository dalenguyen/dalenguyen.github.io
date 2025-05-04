---
title: SafePlate AI - Programmatically Post to Facebook
slug: 2025-05-04-safeplate-ai-programmatically-post-to-facebook
description: Managing food allergies and dietary restrictions can be frustrating and time-consuming, especially when you want to make sure every meal is safe and fits your nutrition goals. I realized there wasn’t a simple tool that could help me quickly identify safe foods and suggest meals tailored to my needs. So, I decided to build one myself.
categories: ['meal planning', 'ai']
coverImage: https://dalenguyen.me/assets/images/blog/safeplate-ai-top.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-05-04T15:17:31.359Z
author: Dale Nguyen
---

<figure>
  <img src="assets/images/blog/safeplate-ai-facebook-post.png" alt="Safeplate AI - Facebook Post" width="100%" height="auto" />
  <figcaption>Safeplate AI - Facebook Post</figcaption>
</figure>

I started working on [SafePlate AI](https://apps.apple.com/app/safeplate-ai/id6742756212) because I wanted to help a loved one who was struggling with food allergies, hoping to make their daily life a little easier. Managing food allergies and dietary restrictions can be frustrating and time-consuming, especially when you want to make sure every meal is safe and fits your nutrition goals. I realized there wasn’t a simple tool that could help me quickly identify safe foods and suggest meals tailored to my needs. So, as a good developer, I decided to build one myself.

- Part 1: [Project Overview](blog/2025-04-23-safeplate-ai-build-a-personal-solution-for-safer-smarter-meal-planning)
- Part 2: **[Programmatically Post to Facebook](blog/2025-05-04-safeplate-ai-programmatically-post-to-facebook)**

In this post, I want to share on of the feature that I added to the product: how to programmatically post to Facebook after a recipe is created.

> The project is built using Google Cloud Platform, Ionic (Angular), NestJS and Vertex AI.

---

## The Architecture

Here is the flow where all the magic happens:

<figure>
  <img src="assets/images/blog/safeplate-ai-diagram-facebook.png" alt="Safeplate AI - Facebook Service Flow" width="100%" height="auto" />
  <figcaption>Safeplate AI - Facebook Service Flow</figcaption>
</figure>

Let's have a look at the steps:

- User generates a recipe from the mobile app
- The recipe and image are created and saved to Firestore & Storage
- The generated meal from Firestore will trigger a cloud run service (**Recipe on Create**)
- Recipe on Create service will retrieve data from Firestore & Storage then call **Facebook Service** to programmatically post to Facebook Page

## Prerequisites

- Register as a [Facebook Developer](https://developers.facebook.com) and create an app in the Facebook Developer Portal.
- Have admin access to the Facebook Page you want to post to.
- Obtain the necessary permissions (**pages_manage_posts, pages_read_engagement**) through [Graph API Explorer](https://developers.facebook.com/tools/explorer).
- Generate a valid Page Access Token.

## Posting to a Facebook Page Using the Graph API

First, make sure that get the Facebook Page ID, and the User Access token in the environment.

```bash
// .env
# Retrieve from Facebook About page
FACEBOOK_PAGE_ID= # The ID of your Facebook Page
# The User Access Token must have 'pages_read_engagement' and 'pages_manage_posts' permissions
FACEBOOK_USER_ACCESS_TOKEN=
```

<figure>
  <img src="assets/images/blog/safeplate-ai-get-user-access-token.png" alt="Safeplate AI - Get User Access Token" width="100%" height="auto" />
  <figcaption>Safeplate AI - Get User Access Token</figcaption>
</figure>

The token will expire in an hour, but you can extend it to **three months** by visiting [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).

After having everything ready, let's start sending generated meal to Facebook Page.

In order to post something to a page, we will get the **Page Access Token** by using **User Access Token**.

```typescript
 /**
   * Get a Page Access Token for a specific Page ID
   * This method directly fetches the access_token field for a specific page ID
   * @param userAccessToken The user access token
   * @param pageId The specific page ID to get the token for
   * @returns The page access token
   */
  async getPageAccessTokenForSpecificPage(userAccessToken: string, pageId: string): Promise<string> {
    try {
      // Use the exact URL format as specified
      const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}?fields=access_token&access_token=${userAccessToken}`;

      const response = await axios.get(url);

      if (response.data && response.data.access_token) {
        const pageToken = response.data.access_token;
        return pageToken;
      } else {
        throw new Error('No access_token field in response');
      }
    } catch (error: any) {
      console.error('Error retrieving Page Access Token directly:', error.response?.data || error.message);
      throw new Error(`Failed to get Page Access Token: ${error.response?.data?.error?.message || error.message}`);
    }
  }
```

After that, let send something to the Facebook Page.

```typescript
const apiUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`
// Use the /photos endpoint for posting images to a Page
const url = `${this.apiUrl}/${pageId}/photos`

const FormData = require('form-data')
const form = new FormData()
form.append('source', imageBuffer, {
  filename: 'image.jpg',
  contentType: mimeType || 'image/jpeg',
})
form.append('caption', caption)
form.append('access_token', accessToken)

const response = await axios.post(url, form, {
  headers: form.getHeaders(),
})
```

The code received image as buffer format, and pass to Facebook Graph API to generate a facebook post with an image. The `pageId` and `accessToken` are from the environment the previous request.

## Common Pitfalls and Best Practices

- **Permissions:** Ensure your app has the right permissions approved via Facebook App Review.
- **Access Tokens:** Use long-lived Page Access Tokens for stability.
- **Deprecations:** The `publish_actions` permission is deprecated; use Page tokens or Share Dialogs instead.
- **Rate Limits:** Respect Facebook API rate limits to avoid errors.
- **App Mode:** Switch your app from Development to Live mode for real user access.
- **Error Handling:** Implement robust error handling to manage token expiration and permission issues.

## Conclusion

Programmatic posting to Facebook Pages via the Graph API empowers businesses and developers to automate content delivery efficiently. For user-driven sharing, the Facebook Share Dialog provides a seamless experience without complex permissions. By following Facebook’s guidelines and best practices, you can integrate Facebook posting smoothly into your applications.

---

## Final Thoughts

SafePlate AI started as a personal solution to a daily challenge and has grown into a tool I’m happy to share with others. It’s not perfect, but it’s practical and built with real-world needs in mind.

If you’re interested in trying it out, you can find it on the [Apple App Store](https://apps.apple.com/app/safeplate-ai/id6742756212). I hope it makes meal planning a little easier and safer for you, just as it has for me.

Thank you for reading, and feel free to reach out with any questions or feedback!

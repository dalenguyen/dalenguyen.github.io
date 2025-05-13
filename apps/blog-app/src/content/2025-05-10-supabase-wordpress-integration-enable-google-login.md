---
title: Supabase WordPress Integration - Enable Google Login
slug: 2025-05-10-supabase-wordpress-integration-enable-google-login
description: This integration bridges the gap between WordPress’s popular CMS capabilities and Supabase’s modern backend services, empowering developers to build next-generation web applications efficiently.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-05-10T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

Integrating Supabase with WordPress offers a modern, scalable way to enhance your WordPress site with powerful backend capabilities such as user authentication and real-time data handling. Let's see how this integration is done.

Get the plugin: https://techcater.com
<br>
Demo Video: https://www.youtube.com/watch?v=BewjtbcFZ3M

> The Google login feature is added in SupaWP v1.2.0

## Why Add Google Login to Your WordPress Site?

- User Convenience: Most users have Google accounts, so Google login reduces friction and increases sign-up rates.
- Security: Google OAuth provides robust, industry-standard security for authentication.
- Centralized User Management: Supabase centralizes authentication and user data, making it easier to manage across multiple platforms.

## Step-by-Step Guide: Adding Google Login via SupaWP

### Set Up Google OAuth Credentials

1. Go to the Google Cloud Console.
2. Navigate to APIs & Services > Credentials.
3. Click Create Credentials and select OAuth Client ID.
4. For Application Type, choose Web Application.
5. Under Authorized JavaScript origins, add your WordPress site URL.
6. Under Authorized redirect URIs, add the callback URL provided by Supabase (found in your Supabase Dashboard’s Google Auth Provider section).

<figure>
  <img src="assets/images/blog/supabase-wordpress-authorized-redirect-uris.png" alt="Add authorized redirect URIs" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Add authorized redirect URIs</figcaption>
</figure>

7. Note the generated Client ID and Client Secret.

<figure>
  <img src="assets/images/blog/supabase-wordpress-oauth-client-created.png" alt="OAuth client created" width="100%" height="auto" />
  <figcaption>OAuth client created</figcaption>
</figure>

### Configure Google Provider in Supabase

1. In your Supabase Dashboard, go to **Authentication > Sign In / Providers > Google**.
2. Enter the Client ID and Client Secret you obtained from Google Cloud.

<figure>
  <img src="assets/images/blog/supabase-wordpress-enable-google-login.png" alt="Configure Sign in with Google" width="100%" height="auto" />
  <figcaption>Configure Sign in with Google</figcaption>
</figure>

3. Remember to add your site URL, so it can be redirected correct on production.

<figure>
  <img src="assets/images/blog/supabase-wordpress-configure-site-url.png" alt="Configure site URL" width="100%" height="auto" />
  <figcaption>Configure site URL</figcaption>
</figure>

### Connect Supabase to WordPress via SupaWP

1. In your WordPress admin, go to the SupaWP plugin settings. Make sure that you're using **SupaWP v1.2.0**
2. Enable Google Login as one of the login method

<figure>
  <img src="assets/images/blog/supabase-wordpress-enable-google-sign-in-method.png" alt="Enable Google Sign In method" width="100%" height="auto" />
  <figcaption>Enable Google Sign In method</figcaption>
</figure>

3. Add Google Login Button to Your WordPress Site by placing the `[supawp_auth]` shortcode on your login or registration page.

<figure>
  <img src="assets/images/blog/supabase-wordpress-sign-in-with-google.png" alt="Supabase WordPress Google Login" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Supabase WordPress Google Login</figcaption>
</figure>

The login form will now include a “Sign in with Google” option. When click “Sign in with Google”, you should be redirected to Google’s consent screen, then back to your WordPress site upon successful login.

### Bonus: manually adding Google Sign In button (JavaScript)

Here’s a minimal example using the Supabase JS client to trigger Google login when a button is clicked:

```javascript
<!-- Include Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<button id="google-login-btn">Sign in with Google</button>

<script>
  // Initialize Supabase client
  const supabase = supabase.createClient(
    'https://YOUR_PROJECT_ID.supabase.co', // Replace with your Supabase project URL
    'YOUR_PUBLIC_ANON_KEY' // Replace with your Supabase public anon key
  );

  document.getElementById('google-login-btn').addEventListener('click', async () => {
    // Redirects to Google OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin // Adjust if you want a custom redirect
      }
    });
    if (error) {
      alert('Login error: ' + error.message);
    }
    // The user will be redirected to Google and then back to your site
  });
</script>
```

Key points:

- Replace `YOUR_PROJECT_ID` and `YOUR_PUBLIC_ANON_KEY` with your actual Supabase project details.
- The `redirectTo` option defines where users are sent after logging in with Google.
- This button can be placed anywhere in your WordPress theme or plugin that allows custom HTML/JS.

## Tips & Troubleshooting

- Custom Domains: If you use a custom domain with Supabase, make sure it’s added to your Google OAuth consent screen’s authorized domains.
- Scopes: Default scopes for Google login should include openid, email, and profile.
- Local Development: For testing locally, add http://localhost to your authorized origins in Google Cloud Console.

## Conclusion

Integrating Google login with Supabase and [SupaWP](https://techcater.com/shop/products) brings modern, secure authentication to WordPress. This setup not only improves user experience but also centralizes and secures your user management using the latest cloud-native technologies.

For more details, refer to the official Supabase documentation on Google Auth and follow the SupaWP plugin’s instructions in your WordPress dashboard.

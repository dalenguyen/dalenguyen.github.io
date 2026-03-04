---
title: Supabase WordPress Integration - Password Reset & Recovery
slug: 2025-10-07-supabase-wordpress-integration-password-reset
description: Enable secure password reset functionality in your WordPress site with SupaWP. Learn how to configure the forgot password flow with both email link and OTP options.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-10-07T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

Password reset is a critical part of any authentication system. [SupaWP](https://techcater.com/shop/products/SUPA_WP) v1.6.0 added forgot password functionality directly to the login shortcode, and v1.11.0 extended it with an OTP-based reset option. This guide covers both methods so you can pick the approach that fits your site.

## Version Requirements

- **Forgot password flow** - SupaWP v1.6.0+
- **OTP-based password reset** - SupaWP v1.11.0+

## How the Password Reset Flow Works

The forgot password form is built into the `[supawp_login]` and `[supawp_auth]` shortcodes. No additional shortcodes or page setup is required.

The general flow is:

1. User clicks **Forgot Password?** on the login form
2. The login form slides out and a forgot password form appears inline
3. User enters their email address and submits
4. Supabase sends a reset email to that address
5. User follows the instructions in the email to set a new password

The exact content of step 4 depends on which verification method you have configured.

## Two Reset Methods

### Method 1: Email Link (Default)

With the email link method, Supabase sends a reset email containing a magic link. The user clicks the link, which redirects them back to your site where they can enter a new password.

This method uses the `{{ .ConfirmationURL }}` variable in the Supabase email template.

### Method 2: OTP Token (v1.11.0+)

With the OTP method, Supabase sends a reset email containing a 6-digit code instead of a link. The user enters the code on your site to authenticate the reset, then sets a new password without ever leaving your domain.

This method uses the `{{ .Token }}` variable in the Supabase email template.

## Configuring the Verification Method

1. Go to **WordPress Admin** > **SupaWP** > **Settings**
2. Find **Email Verification Method**
3. Choose either **Magic Link** or **6-Digit Code**
4. Click **Save Changes**

Make sure your Supabase email template matches this setting (see below).

## Supabase Email Templates

Log into your Supabase Dashboard and navigate to **Authentication** > **Email Templates** > **Reset Password**.

### Magic Link Template

```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>Click the button below to reset your password:</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours. If you did not request a password reset, you can safely ignore this email.</p>
```

### OTP Token Template

```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>Use the code below to reset your password on our website:</p>

<div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
    {{ .Token }}
  </div>
</div>

<p>This code expires in 24 hours and can only be used once. If you did not request a password reset, you can safely ignore this email.</p>
```

> **Important:** The SupaWP setting and the Supabase email template must use the same method. If SupaWP is set to 6-Digit Code but your template still uses `{{ .ConfirmationURL }}`, the reset flow will not work correctly.

## Shortcode Usage

The forgot password functionality is available in these shortcodes without any extra attributes:

```php
[supawp_login]
```

```php
[supawp_auth]
```

You do not need to add any attribute to enable forgot password - it is included by default in both shortcodes from v1.6.0 onwards.

## Security Considerations

- Reset tokens and OTP codes are **time-limited** (24 hours by default in Supabase)
- Tokens are **single-use** - they are invalidated after one successful reset
- Supabase rate-limits reset email requests to prevent abuse

## Troubleshooting

**Reset email not arriving?**

- Check the spam or junk folder
- Verify that the email address entered matches an existing account
- Confirm that Supabase email settings are configured in your Supabase project

**Magic link not working?**

- Make sure your site URL is whitelisted in **Supabase Dashboard** > **Authentication** > **URL Configuration** > **Redirect URLs**
- Verify the link has not expired (24-hour limit)

**OTP code not working?**

- Confirm that SupaWP's Email Verification Method is set to 6-Digit Code
- Confirm the Supabase Reset Password template uses `{{ .Token }}`
- Ensure the code is entered within the 24-hour expiry window

## Conclusion

[SupaWP](https://techcater.com/shop/products/SUPA_WP) makes password recovery straightforward by integrating the forgot password flow directly into the existing login shortcode. Whether you prefer the traditional email link approach or the modern OTP experience, both options are supported and can be switched at any time from the SupaWP settings panel.

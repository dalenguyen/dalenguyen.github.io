---
title: Supabase WordPress Integration - OTP Email Verification & Passwordless Login
slug: 2025-11-20-supabase-wordpress-integration-otp-email-verification
description: Implement modern OTP-based email verification and passwordless login in WordPress with SupaWP. Learn about 6-digit token verification for signup, smart unverified user flows, and passwordless authentication.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-11-20T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

[SupaWP](https://techcater.com/shop/products/SUPA_WP) has evolved its email verification system significantly across three versions. v1.8.0 brought OTP login to the login shortcode, v1.9.0 added OTP verification at signup and a smart flow for unverified users, and v1.12.0 introduced the option to skip verification entirely. This guide covers all three verification modes so you can choose the right setup for your audience.

## Version Requirements

- **OTP login (passwordless)** - SupaWP v1.8.0+
- **OTP signup verification + unverified user flow** - SupaWP v1.9.0+
- **No Verification option** - SupaWP v1.12.0+

## Three Email Verification Options

| Feature | Magic Link | 6-Digit OTP | No Verification |
|---------|------------|-------------|-----------------|
| User stays on site | No | Yes | Yes |
| Code required | No | Yes | No |
| Security | Good | Excellent | None |
| Mobile friendly | Good | Excellent | N/A |
| Best for | General use | Mobile / high security | Internal / trusted apps |

### Option 1: Magic Link (Default)

The classic approach. After signup or a passwordless login request, Supabase sends an email with a verification link. Clicking the link redirects the user back to your site where the action completes automatically.

Best for sites where simplicity matters and users are comfortable clicking email links.

### Option 2: 6-Digit OTP Token

Supabase sends a 6-digit code to the user's inbox. The user types it directly into a form on your site without ever navigating away. SupaWP renders the verification input inline, keeping the entire flow on a single page.

Best for mobile users, higher-security applications, or anywhere you want a seamless single-page experience.

### Option 3: No Verification (v1.12.0)

New users can sign up and log in without any email verification step. SupaWP skips the confirmation flow entirely.

Best for internal tools, admin portals, or apps where you handle identity verification through another mechanism.

## Setting Up OTP Verification

### Step 1: Configure SupaWP

1. Go to **WordPress Admin** > **SupaWP** > **Settings**
2. Set **Email Verification Method** to **6-Digit Code**
3. Click **Save Changes**

### Step 2: Update the Supabase Email Template

Log into your Supabase Dashboard and go to **Authentication** > **Email Templates** > **Confirm signup**.

Replace the default template with the following:

```html
<h2>Verify Your Email</h2>

<p>Hi there,</p>

<p>Thank you for signing up! To complete your registration, please enter this verification code on our website:</p>

<div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
    {{ .Token }}
  </div>
</div>

<p>This code expires in 24 hours.</p>

<p>If you didn't create an account, you can safely ignore this email.</p>
```

Click **Save** in the Supabase dashboard.

> **Important:** SupaWP's setting and the Supabase template must match. If SupaWP is set to 6-Digit Code but the template still uses `{{ .ConfirmationURL }}`, verification will fail.

## OTP Verification at Signup

Once the OTP method is configured, the signup flow changes as follows:

1. User fills in the signup form (`[supawp_signup]` or `[supawp_auth]`)
2. On submit, the signup form hides and a 6-digit code input appears inline
3. Supabase sends the verification code to the user's email
4. User enters the code on the same page
5. Email is verified in real time and the user is logged in

No page navigation, no waiting for a redirect. The entire flow happens within the same WordPress page.

## OTP Passwordless Login

Starting with v1.8.0, the `[supawp_login]` and `[supawp_auth]` shortcodes support passwordless login via OTP. Users can authenticate using only their email address and a one-time code.

The flow:

1. User toggles to the **Email OTP** login method on the login form
2. User enters their email address and submits
3. Supabase sends a 6-digit code to that inbox
4. User enters the code on the same page
5. User is logged in - no password required

This is particularly useful when you want to offer passwordless authentication as an alternative to, or replacement for, traditional password login.

## Smart Unverified Email Login Flow (v1.9.0)

One of the most practical additions in v1.9.0 is the smart handling of users who signed up but never verified their email. Rather than blocking them with an error, SupaWP turns the situation into a guided recovery:

**Traditional behavior (Magic Link):**
```
User tries login → Blocked with error → "Please verify your email"
```

**Smart behavior (6-Digit Code):**
```
User tries login → System detects unverified email
→ Resends new verification code
→ Shows inline verification form on login page
→ User enters code → Verified and auto-logged in
```

### Detailed Smart Flow

**Step 1:** User enters email and password on the login form and clicks Login.

**Step 2:** SupaWP detects the credentials are correct but the email is unverified. It automatically resends a fresh verification code to that address.

**Step 3:** The login form is replaced inline by a verification form:

```
Your email is not verified.
A new verification code has been sent to email@example.com

Enter 6-digit code: [______]

[Verify Email]

[Resend Code] | [Back to Login]
```

**Step 4:** User checks their inbox, enters the 6-digit code, and clicks Verify Email.

**Step 5:** SupaWP verifies the code, marks the email as confirmed, and auto-logs the user in - preserving the original password they entered so no extra login step is needed.

### Why This Matters

With Magic Link, a user who forgot to verify is completely stuck without support intervention. With 6-Digit Code, they can self-recover in under a minute without leaving your site.

## No Verification Option (v1.12.0)

To disable email verification entirely:

1. Go to **WordPress Admin** > **SupaWP** > **Settings**
2. Set **Email Verification Method** to **No Verification**
3. Click **Save Changes**

New users can sign up and immediately log in without any email confirmation step. This is appropriate for:

- Internal company tools where all users are trusted
- Applications where identity is verified through another system
- Development and testing environments

## Shortcode Reference

All three verification modes work with the following shortcodes:

```php
[supawp_signup]
```

Signup form only. The verification step (if enabled) appears inline after the form is submitted.

```php
[supawp_login]
```

Login form with optional OTP login toggle. Handles the unverified email flow automatically when OTP mode is active.

```php
[supawp_auth]
```

Combined login and signup form. Supports all OTP features in a single shortcode.

## Troubleshooting

**Users not receiving verification codes:**

- Check Supabase email settings in your project dashboard
- Verify the email template is saved and uses `{{ .Token }}`
- Ask users to check spam or junk folders
- Check Supabase email rate limits (typically 1 code per 60 seconds per address)

**Codes not working:**

- Confirm SupaWP's Email Verification Method matches the Supabase template variable
- Ensure the code is entered within 24 hours of being issued
- Verify the user is entering exactly 6 digits with no extra spaces
- Use the **Resend Code** button to get a fresh code if the original expired

**OTP login toggle not visible:**

- Confirm you are running SupaWP v1.8.0 or later
- Verify the Email Verification Method is set to 6-Digit Code in settings

## Conclusion

SupaWP's OTP email verification system gives you fine-grained control over the signup and login experience. The 6-digit code approach keeps users on your site throughout the entire flow, handles unverified accounts gracefully, and supports passwordless authentication as a first-class feature. For teams that want zero friction, the No Verification option is also available.

Get started at [SupaWP](https://techcater.com/shop/products/SUPA_WP) and pick the verification mode that fits your audience.

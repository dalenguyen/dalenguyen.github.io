---
title: SupaWP Extra Fields Guide - Customizing Signup Forms
slug: 2025-10-04-supawp-extra-fields-guide
description: Learn how to use SupaWP's extra fields feature to create custom signup flows by collecting additional user information during signup, including first name, last name, phone, and company data with flexible validation options.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-10-04T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

[SupaWP](https://techcater.com/shop/products/SUPA_WP), a powerful WordPress plugin, provides a flexible signup form system that allows you to collect additional user information beyond the standard email and password fields. This guide will show you how to use the `extra_fields` and `required_fields` attributes to create custom signup flows.

> **Important:** For custom signup flows, you must use `email_confirmation="false"` to bypass email verification and log users in immediately.

<figure>
  <img src="assets/images/blog/supawp-custom-form.gif" alt="Sample custom sign up form" width="100%" height="auto" />
  <figcaption>Sample custom sign up form</figcaption>
</figure>

## Available Extra Fields

[SupaWP](https://techcater.com/shop/products/SUPA_WP) supports the following extra fields:

- **first_name** - User's first name
- **last_name** - User's last name
- **phone** - Phone number
- **company** - Company name

## Basic Usage

### Simple Signup Form

The most basic signup form only collects email and password:

```php
[supawp_signup]
```

### Adding Extra Fields

To add extra fields to your signup form, use the `extra_fields` attribute with a comma-separated list:

```php
[supawp_signup extra_fields="first_name,last_name" email_confirmation="false"]
```

This will display first name and last name fields in addition to the standard email and password fields.

### Making Fields Required

By default, extra fields are optional. To make specific fields required, use the `required_fields` attribute:

```php
[supawp_signup extra_fields="first_name,last_name,phone" required_fields="first_name,last_name" email_confirmation="false"]
```

In this example, first name and last name are required, but phone is optional.

## Complete Examples

### Example 1: Basic Contact Information

Collect name and email with both fields required:

```php
[supawp_signup extra_fields="first_name,last_name" required_fields="first_name,last_name" email_confirmation="false"]
```

### Example 2: Business Registration

Collect comprehensive business user information:

```php
[supawp_signup extra_fields="first_name,last_name,phone,company" required_fields="first_name,last_name,company" email_confirmation="false"]
```

This makes first name, last name, and company required, while phone is optional.

### Example 3: With Redirect and Custom Class

Add styling and redirect after signup:

```php
[supawp_signup
  extra_fields="first_name,last_name,phone"
  required_fields="first_name,last_name"
  email_confirmation="false"
  redirect="/welcome"
  class="my-custom-form"]
```

### Example 4: Custom Signup Flow (Recommended)

For custom signup flows, disable email confirmation to log users in immediately:

```php
[supawp_signup
  extra_fields="first_name,last_name"
  email_confirmation="false"]
```

**Note:** `email_confirmation="false"` is essential for custom signup flows as it allows users to be logged in immediately without waiting for email verification.

## Using the Combined Auth Form

The `supawp_auth` shortcode combines login and signup forms in one interface and supports the same extra fields:

```php
[supawp_auth
  default="signup"
  extra_fields="first_name,last_name,phone,company"
  required_fields="first_name,last_name"
  email_confirmation="false"
  redirect="/dashboard"]
```

### Auth Form Attributes

- **default** - Set to "login" or "signup" to determine which form displays first
- **extra_fields** - Same as signup form
- **required_fields** - Same as signup form
- **email_confirmation** - "true" or "false" (default: "true")
- **redirect** - URL to redirect after successful authentication
- **class** - Custom CSS class for styling

## Tips and Best Practices

1. **Don't overwhelm users** - Only request information you actually need. Shorter forms have higher conversion rates.

2. **Mark required fields clearly** - Users appreciate knowing upfront which fields are mandatory.

3. **Consider your audience** - For B2B applications, company and phone fields make sense. For consumer apps, keep it minimal.

4. **Test your forms** - Make sure required validation works as expected before going live.

5. **Use email confirmation wisely** - For custom signup flows, `email_confirmation="false"` is essential to provide immediate access. Email confirmation adds security but can reduce conversion rates and interrupt the user experience.

## Field Validation

All extra fields include basic validation:

- Email fields validate for proper email format
- Password fields include strength indicators
- Required fields prevent form submission if empty
- Phone and text fields accept standard text input

## Accessing User Data

Once users sign up with extra fields, this data is stored in your Supabase database and can be accessed through:

- Supabase dashboard
- SupaWP REST API endpoints
- WordPress user metadata (if synced)

## Troubleshooting

**Fields not showing up?**

- Check that field names are spelled correctly (use underscores, not hyphens)
- Verify the shortcode syntax is correct

**Required validation not working?**

- Ensure field names in `required_fields` match those in `extra_fields`
- Check browser console for JavaScript errors

**Styling issues?**

- Use the `class` attribute to add custom CSS classes
- All fields use `.supawp-form-group` class for consistent styling

## Conclusion

[SupaWP](https://techcater.com/shop/products/SUPA_WP)'s extra fields feature provides a flexible way to collect user information during signup without writing any code. By combining `extra_fields` and `required_fields` attributes with `email_confirmation="false"`, you can create custom signup flows that provide immediate access to users while maintaining a clean, user-friendly interface.

This guide demonstrates how [SupaWP](https://techcater.com/shop/products/SUPA_WP)'s flexible form system can be customized to meet various business requirements, from simple contact collection to comprehensive business registration forms. Remember that `email_confirmation="false"` is essential for creating seamless custom signup experiences.

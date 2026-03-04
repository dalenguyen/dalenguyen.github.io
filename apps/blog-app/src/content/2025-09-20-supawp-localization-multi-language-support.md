---
title: SupaWP Localization - Multi-Language Support for WordPress Authentication
slug: 2025-09-20-supawp-localization-multi-language-support
description: Learn how to configure SupaWP's multi-language support to serve international users with Spanish, French, and Korean translations for all authentication forms and messages.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-09-20T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

[SupaWP](https://techcater.com/shop/products/SUPA_WP) v1.4.0 introduced comprehensive localization and internationalization support, making it possible to serve international audiences with fully translated authentication forms and messages. This guide walks you through how SupaWP's multi-language system works and how to configure it for your WordPress site.

## Supported Languages

Out of the box, SupaWP v1.4.0 ships with translations for three languages in addition to English:

- **Spanish** (`es_ES`)
- **French** (`fr_FR`)
- **Korean** (`ko_KR`)

Translation files are provided as PO/MO files for all supported languages, along with a POT template that you can use to add new languages.

## How It Works

SupaWP's localization system is built on two pillars:

### PHP: `i18n/public_translations.php`

On the server side, SupaWP loads translations through the `i18n/public_translations.php` file. This file handles all PHP-side strings and passes them to the frontend using WordPress's standard localization pipeline.

### TypeScript Translation Utilities

On the frontend, SupaWP uses TypeScript translation utilities with type-safe interfaces. These utilities consume the translated strings passed from PHP and apply them to all rendered form elements. Type safety ensures that missing or misnamed translation keys are caught at build time, not at runtime.

### Automatic Supabase Error Mapping

One particularly useful feature is automatic Supabase error mapping. When Supabase returns an error response (for example, "Email not confirmed" or "Invalid login credentials"), SupaWP maps those error codes to translated messages in the active language. Your users never see raw English error strings from the Supabase API.

## What Gets Translated

All visible text in SupaWP's authentication UI respects the active WordPress language setting. This includes:

- Login, signup, and logout form labels
- Input placeholder text
- Button labels ("Sign In", "Create Account", "Log Out", etc.)
- Inline validation messages (required field errors, password mismatch, etc.)
- Success and error messages
- Password strength indicators

The following shortcodes are fully covered by the translation system:

```php
[supawp_login]
[supawp_signup]
[supawp_auth]
[supawp_logout]
```

## Configuring the Site Language

SupaWP automatically uses whatever language WordPress is configured to use. To change the site language:

1. Go to **WordPress Admin** > **Settings** > **General**
2. Find the **Site Language** dropdown
3. Select your desired language (e.g., `Espanol`, `Francais`, `Korean`)
4. Click **Save Changes**

SupaWP will detect the change and serve all authentication UI in the selected language immediately - no additional plugin configuration required.

## Adding a New Language

If you need a language not included by default, you can create your own translation using the provided POT template:

1. Locate the POT file in the `languages/` directory of the SupaWP plugin
2. Open it with a PO editor such as [Poedit](https://poedit.net/)
3. Translate all strings
4. Save as a PO file named following WordPress conventions, e.g., `supawp-de_DE.po`
5. Compile the PO file to a MO file (Poedit does this automatically on save)
6. Place both files in the `languages/` directory

WordPress will pick up the new language file as long as the filename matches the locale code configured in **Settings > General > Site Language**.

## POT File and Translation Pipeline

The POT (Portable Object Template) file is the master template that lists every translatable string in the plugin. When SupaWP is updated and new strings are added, a new POT is generated and the existing PO files are updated to include any new entries.

The translation pipeline looks like this:

```
POT Template → PO File (human-readable) → MO File (compiled binary)
```

WordPress loads the MO file at runtime for performance. Always compile a fresh MO file after editing a PO file.

## Technical Notes

- Requires **SupaWP v1.4.0** or later
- Language selection is fully automatic based on WordPress site language
- All four shortcodes (`[supawp_login]`, `[supawp_signup]`, `[supawp_auth]`, `[supawp_logout]`) are covered
- Supabase API error strings are mapped to translated equivalents automatically
- TypeScript type-safe interfaces prevent missing translation key errors

## Conclusion

SupaWP's localization support makes it straightforward to build multilingual WordPress authentication flows without any custom code. By leaning on WordPress's built-in language system and providing ready-made translations for Spanish, French, and Korean, [SupaWP](https://techcater.com/shop/products/SUPA_WP) removes the friction of serving international users.

If your target language is not yet supported, the included POT template gives you everything you need to create your own translation and contribute it back to the community.

---
title: Supabase WordPress Integration - Save Data to Supabase
slug: 2025-05-31-supabase-wordpress-integration-save-data-to-supabase
description: This integration bridges the gap between WordPress’s popular CMS capabilities and Supabase’s modern backend services, empowering developers to build next-generation web applications efficiently.
categories: ['supabase', 'wordpress']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-05-31T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

Integrating Supabase with WordPress offers a modern, scalable way to enhance your WordPress site with powerful backend capabilities such as user authentication and real-time data handling. Let's see how this integration is done.

Get the plugin: https://techcater.com
<br>
Demo Video: https://www.youtube.com/watch?v=sacI1nj_icc

In this article, I will show you how to use [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) to save data from WordPress to Supabase.

## Supabase table preparation

The SupaWP plugin does the hard lifting of the integration between WordPress and Supabase. In case you are curious on how to create the table, please continue reading. We will the table and its policies in order to save data to it.

You can create a table using the Supabase Dashboard or SQL editor.

### Using the Dashboard

1. Go to your [Supabase project dashboard](https://app.supabase.com/).
2. Navigate to **Table Editor** > **New Table**.
3. Enter a table name (e.g., `contacts`).
4. Add columns as needed, for example:
   - `id` (UUID, Primary Key, default: `gen_random_uuid()`)
   - `first_name` (text)
   - `last_name` (text)
   - `email` (text)
   - `phone` (text)
   - `age` (integer)
   - `date_of_birth` (timestamp)
   - `contact` (jsonb) — for nested contact info (first_name, last_name, sex)
   - `hobbies` (text[] array)
   - `food` (text[] array)
   - `gender` (text)
   - `created_at` (timestamp, default: `now()`)
   - `updated_at` (timestamp, default: `now()`)
5. Click **Save** to create the table.

   > **Note:**
   >
   > - Use **jsonb** for objects (e.g., `contact`).
   > - Use **text[]** for arrays (e.g., `hobbies`, `food`).

### Using SQL editor

```sql
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  age integer,
  date_of_birth timestamp,
  contact jsonb,
  hobbies text[],
  food text[],
  gender text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Protect your tables with Row Level Security (RLS)

Supabase enables RLS by default for new tables. If not, enable it:

```sql
alter table public.contacts enable row level security;
```

To allow your frontend to insert data, add a policy. For public forms, you might allow all inserts (not recommended for sensitive data). For authenticated users, restrict by user.

#### Example: Allow All Inserts (for testing only)

```sql
create policy "Allow insert for all" on public.contacts
  for insert
  with check (true);
```

#### Example: Allow All Updates (for upsert, testing only)

```sql
create policy "Allow update for all" on public.contacts
  for update
  using (true);
```

#### Example: Allow All Selects (for testing/public access)

```sql
create policy "Allow select for all" on public.contacts
  for select
  using (true);
```

> **Note:**
> Upsert operations require SELECT, INSERT and UPDATE permissions. For production, restrict these policies to authenticated users or add more conditions.

#### Example: Allow Inserts Only for Authenticated Users

If you have authentication, use:

```sql
create policy "Allow insert for authenticated" on public.contacts
  for insert
  using (auth.uid() is not null);
```

## Form generation

When you have the table ready, let's start to generate a form to save data to Supabase. Here's an example of form that you can copy and paste:

```markdown
[hidden table "contacts"]
[hidden id "optional-table-id"]
[hidden arrayType "hobbies,food"]
[hidden dateType "date_of_birth"]
[hidden objectType "contact"]
[hidden integerTypes "age"]

[text* first_name placeholder "First Name"]
[text* last_name placeholder "Last Name"]
[text* email placeholder "Email"]
[tel phone placeholder "+1 647 620 0000"]

<label for="age">Age</label>
[number age id:age min:1 max:100]

<label for="date_of_birth">Date of Birth</label>
[date* date_of_birth id:date_of_birth] [text* contact__first_name placeholder "Contact First Name"] [text*
contact__last_name placeholder "Contact Last Name"]

<label for="contact__sex">Contact Sex</label>
[select* contact__sex id:contact__sex "Male" "Female" "Other"]

<label for="hobbies">Hobbies</label>
[select* hobbies id:hobbies multiple "Archery" "Slap Dance" "Rock Climbing"]

<label for="food">Food</label>
[checkbox food id:food "Pho" "Ramen" "Dimsum"]

<label for="gender">Gender</label>
[radio gender id:gender default:1 "Male" "Female" "Other"] [submit id:supawp-data-submit "Submit"]
```

Let's have a look into the the form in detail. The hidden fields are important.

- [hidden table contacts] -> table name is `contacts`.
- [hidden id “optional-table-id”] (optional) -> it will override the row id.
- [hidden arrayType “hobbies,food”] (optional) -> array data should be added to arrayType field.
- [hidden dateType “date_of_birth”] (optional) -> will save as ISO string type.
- [hidden objectType “contact”] (optional) -> will save a map (object) type
- [hidden integerTypes “age”] (optional) -> will save as integer type

After that, all you need to do it put the shortcode into your WordPress page and it's done!

```html
[contact-form-7 id="REPLACE_WITH_YOUR_FORM_ID" title="Add new contact" html_id="supawp-create-data-form"]
```

> Remember to put `html_id="supawp-create-data-form"`, without it, the data will not be saved to supabase!

## Conclusion

The SupaWP plugin from [TechCater](https://techcater.com/shop/products) simplifies integrating Supabase’s powerful backend services with WordPress, providing scalable authentication, real-time data, and centralized user management. In this article, you know how to create a form and save data from WordPress and save it to Supabase database.

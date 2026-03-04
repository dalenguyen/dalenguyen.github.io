---
title: Supabase WordPress Integration - Sync WordPress Posts and Pages to Supabase
slug: 2025-08-16-supabase-wordpress-integration-sync-wordpress-posts-and-pages-to-supabase
description: Learn how to set up automatic synchronization between WordPress and Supabase using the SupaWP plugin. This comprehensive guide covers table setup, security policies, and real-time content delivery for modern applications.
categories: ['supabase', 'wordpress', 'tutorial', 'cms']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-08-16T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

Are you looking to create a modern, scalable architecture for your WordPress site? Syncing your WordPress content to Supabase opens up powerful possibilities for headless websites, mobile apps, and real-time applications. In this comprehensive guide, we'll walk you through setting up automatic post and page synchronization from WordPress to Supabase using the SupaWP plugin.

## Why Sync WordPress to Supabase?

Before diving into the setup, let's understand the benefits:

- **🚀 Performance**: Lightning-fast content delivery through Supabase's edge network
- **📱 Multi-platform**: Build mobile apps, SPAs, and JAMstack sites using the same content
- **🔄 Real-time**: Instant content updates across all your applications
- **🔒 Security**: Robust Row Level Security (RLS) policies protect your data
- **💰 Cost-effective**: Pay only for what you use with Supabase's pricing model

## Prerequisites

Before getting started, make sure you have:

- WordPress site with admin access
- Supabase account and project
- SupaWP plugin installed (v1.3.2 or later)
- Basic understanding of SQL for table setup

## Step 1: Install and Configure SupaWP

### Install the Plugin

1. Download the SupaWP plugin
2. Upload to your WordPress site via **Plugins → Add New → Upload**
3. Activate the plugin

### Configure Basic Settings

Navigate to **WordPress Admin → SupaWP** and configure:

**General Settings:**

- **Supabase URL**: Your project URL (e.g., `https://your-project.supabase.co`)
- **Supabase Anon Key**: Your public API key

**Security Settings (Critical):**

- **Supabase Service Role Key**: Your service role key for server-side operations
- This key bypasses Row Level Security and should never be exposed to the frontend

⚠️ **Security Note**: Always configure the Service Role Key for production use. This ensures secure write operations from WordPress while maintaining public read access.

<figure>
  <img src="assets/images/blog/supabase-add-service-role-key.png" alt="Service role key" width="100%" height="auto" />
  <figcaption>Service role key</figcaption>
</figure>

## Step 2: Set Up Supabase Tables

### Create the Posts Table

In your Supabase SQL editor, run this command to create the posts table:

```sql
CREATE TABLE public.wp_posts (
  id integer PRIMARY KEY,
  post_title text,
  post_content text,
  post_excerpt text,
  post_status text,
  post_type text,
  post_date timestamptz,
  post_modified timestamptz,
  permalink text,
  post_thumbnail text,
  author jsonb,
  taxonomies jsonb,
  custom_fields jsonb,
  synced_at timestamptz DEFAULT now()
);
```

### Create the Pages Table

```sql
CREATE TABLE public.wp_pages (
  id integer PRIMARY KEY,
  post_title text,
  post_content text,
  post_excerpt text,
  post_status text,
  post_type text,
  post_date timestamptz,
  post_modified timestamptz,
  permalink text,
  post_thumbnail text,
  author jsonb,
  taxonomies jsonb,
  custom_fields jsonb,
  synced_at timestamptz DEFAULT now()
);
```

## Step 3: Implement Row Level Security

Security is paramount when exposing your content through an API. Let's set up RLS policies that allow public read access while restricting write operations to WordPress only.

### Enable RLS on Posts Table

```sql
-- Enable Row Level Security
ALTER TABLE public.wp_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anonymous users can read published posts)
CREATE POLICY "Allow public read access"
ON public.wp_posts FOR SELECT
TO anon
USING (post_status = 'publish');

-- Allow authenticated users to read all posts
CREATE POLICY "Allow authenticated read access"
ON public.wp_posts FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update/delete (WordPress backend only)
CREATE POLICY "Service role can manage posts"
ON public.wp_posts FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Deny all write operations for anonymous and authenticated users
CREATE POLICY "Deny public writes"
ON public.wp_posts FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny public updates"
ON public.wp_posts FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny public deletes"
ON public.wp_posts FOR DELETE
TO anon, authenticated
USING (false);
```

### Apply the Same Security to Pages

Repeat the same RLS setup for the `wp_pages` table, replacing table references accordingly.

## Step 4: Configure WordPress Sync Settings

Now let's configure which content types to sync:

1. Go to **WordPress Admin → SupaWP → Sync Data tab**
2. **Select Post Types**: Check "Posts" and "Pages"
3. **Custom Post Types**: Add any custom post types (comma-separated, e.g., `product, event`)
4. Click **Save Settings**

<figure>
  <img src="assets/images/blog/supabase-select-wordpress-post-type.png" alt="Select WordPress post type" width="100%" height="auto" />
  <figcaption>Select WordPress post type</figcaption>
</figure>

## Step 5: Understanding the Sync Process

Once configured, SupaWP automatically handles synchronization:

### What Gets Synced

The plugin captures comprehensive post data:

- **Basic Info**: Title, content, excerpt, status, type
- **Metadata**: Publish date, modified date, permalink
- **Media**: Featured image URL (with retry mechanism for processing delays)
- **Author Data**: Author information as JSON
- **Taxonomies**: Categories, tags, and custom taxonomies
- **Custom Fields**: All non-private custom fields

### When Sync Happens

Automatic synchronization triggers on:

1. **Creating a new post** → Immediately synced to Supabase
2. **Updating existing content** → Updates the Supabase record
3. **Moving to trash** → Removes from Supabase
4. **Permanent deletion** → Removes from Supabase

<figure>
  <img src="assets/images/blog/supabase-wp-posts-table.png" alt="wp_posts table in supabase" width="100%" height="auto" />
  <figcaption>wp_posts table in supabase</figcaption>
</figure>

## Step 6: Using Your Synced Data

### Frontend API Access

With your content synced, you can now access it from any frontend application:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://your-project.supabase.co', 'your-anon-key')

// Get all published posts
const { data: posts } = await supabase
  .from('wp_posts')
  .select('*')
  .eq('post_status', 'publish')
  .order('post_date', { ascending: false })

// Get a specific post by ID
const { data: post } = await supabase.from('wp_posts').select('*').eq('id', 123).single()

// Search posts by title
const { data: searchResults } = await supabase
  .from('wp_posts')
  .select('*')
  .textSearch('post_title', 'search term')
  .eq('post_status', 'publish')
```

### Real-time Subscriptions

Take advantage of Supabase's real-time capabilities:

```javascript
// Subscribe to new posts
const subscription = supabase
  .channel('wp_posts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wp_posts' }, (payload) => {
    console.log('New post published:', payload.new)
    // Update your UI in real-time
  })
  .subscribe()
```

## Step 7: Advanced Customization

### Custom Data Modification

You can modify data before it's saved to Supabase:

```php
// In your theme's functions.php
add_filter('supawp_before_saving_to_supabase', function($data) {
  // Add site information
  $data['site_url'] = get_site_url();

  // Add custom SEO data
  $data['seo_title'] = get_post_meta($data['id'], '_yoast_wpseo_title', true);

  // Sanitize content for API consumption
  if (isset($data['post_content'])) {
    $data['post_content'] = wp_strip_all_tags($data['post_content']);
  }

  return $data;
});
```

### Sync Event Hooks

Monitor sync operations:

```php
// Log successful syncs
add_action('supawp_after_saving_to_supabase', function($response_data, $original_data) {
  error_log('Post synced: ' . $original_data['post_title']);
}, 10, 2);

// Handle sync failures
add_action('supawp_sync_error', function($error, $post_data) {
  // Send notification to admin
  wp_mail(get_option('admin_email'), 'Sync Error', $error);
}, 10, 2);
```

### Manual Sync Operations

Use SupaWP's filter system for custom operations:

```php
// Manually sync specific post
$post_data = array(
  'id' => 123,
  'post_title' => 'Custom Post',
  'custom_field' => 'Additional data'
);
apply_filters('supawp_save_data_to_supabase', $post_data);

// Get data from Supabase
$posts = apply_filters('supawp_get_data_from_supabase', 'wp_posts', array(
  'post_status' => 'eq.publish',
  'limit' => '10'
));
```

## Troubleshooting Common Issues

### Posts Not Syncing

1. **Check post type selection** in SupaWP settings
2. **Verify Service Role Key** is configured (not just anon key)
3. **Ensure tables exist** in Supabase with correct naming convention

### Permission Errors

1. **Verify RLS policies** allow service_role to write
2. **Check service role key** is correct and has proper permissions
3. **Test connection** from WordPress admin

### Image Sync Issues

1. **Enable WordPress debugging** to see detailed error logs
2. **Check featured image processing** - some themes delay image processing
3. **Verify image URLs** are publicly accessible

### Debug Logging

Enable WordPress debug logging:

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check `/wp-content/debug.log` for SupaWP error messages.

## Best Practices for Production

### Performance Optimization

1. **Index your tables** for common query patterns:

   ```sql
   CREATE INDEX idx_wp_posts_status_date
   ON wp_posts(post_status, post_date DESC);
   ```

2. **Use selective querying** - only fetch fields you need
3. **Implement caching** in your frontend application

### Security Considerations

1. **Never expose service role key** to frontend
2. **Regularly rotate API keys**
3. **Monitor database access** through Supabase dashboard
4. **Use RLS policies** to restrict data access appropriately

### Monitoring and Maintenance

1. **Set up monitoring** for sync operations
2. **Regular backups** of Supabase data
3. **Monitor API usage** and costs
4. **Keep SupaWP updated** for latest features and security fixes

## Use Cases and Examples

### JAMstack Blog

Create a lightning-fast blog using Supabase as your content API:

```javascript
// Next.js example
export async function getStaticProps() {
  const { data: posts } = await supabase
    .from('wp_posts')
    .select('id, post_title, post_excerpt, post_date, permalink')
    .eq('post_status', 'publish')
    .order('post_date', { ascending: false })
    .limit(10)

  return {
    props: { posts },
    revalidate: 60, // Revalidate every minute
  }
}
```

### Mobile App Integration

Use the same content in your React Native app:

```javascript
const [posts, setPosts] = useState([])

useEffect(() => {
  const fetchPosts = async () => {
    const { data } = await supabase.from('wp_posts').select('*').eq('post_status', 'publish')
    setPosts(data)
  }

  fetchPosts()
}, [])
```

### Multi-site Content Distribution

Sync content from one WordPress site to multiple frontend applications, each with different presentation layers but the same content source.

## Conclusion

Syncing WordPress to Supabase with SupaWP opens up a world of possibilities for modern web development. You get the familiar WordPress editing experience combined with the power and flexibility of Supabase's modern database and real-time capabilities.

The automatic synchronization ensures your content is always up-to-date across all platforms, while the robust security model keeps your data safe. Whether you're building a headless website, mobile app, or multi-platform content distribution system, this setup provides a solid foundation for scalable, modern applications.

Start with the basic setup outlined in this guide, then gradually explore the advanced customization options as your needs grow. The combination of WordPress's content management capabilities and Supabase's modern infrastructure creates a powerful platform for any content-driven application.

## Resources

- [SupaWP Plugin](https://techcater.com/shop/products/SUPA_WP)
- [Supabase Documentation](https://supabase.com/docs)
- [WordPress Developer Resources](https://developer.wordpress.org)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

_This guide covers SupaWP v1.3.3 and later. Features and configuration may vary in different versions._

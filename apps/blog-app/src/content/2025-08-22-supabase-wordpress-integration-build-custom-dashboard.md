---
title: Supabase WordPress Integration - Build a Custom Dashboard
slug: 2025-08-22-supabase-wordpress-integration-build-custom-dashboard
description: Learn how to create powerful custom dashboards in WordPress using the SupaWP plugin and Supabase. This comprehensive guide covers dashboard creation, data filtering, and real-time updates for modern WordPress applications.
categories: ['supabase', 'wordpress', 'tutorial', 'dashboard']
coverImage: https://dalenguyen.me/assets/images/blog/supabase-wordpress-integration.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-08-22T15:17:31.359Z
series: Supabase WordPress Integration
author: Dale Nguyen
---

Building custom dashboards for your WordPress site has never been easier with the SupaWP plugin. This guide will walk you through creating a simple yet powerful dashboard that displays data from your Supabase database directly on your WordPress frontend.

<figure>
  <img src="assets/images/blog/supabase-wordpress-custom-dashboard.png" alt="SupaWP Sample Dashboard" width="100%" height="auto" />
  <figcaption>SupaWP Sample Dashboard</figcaption>
</figure>

## Prerequisites

Before we begin, make sure you have:

- WordPress site with SupaWP plugin installed and configured
- Supabase project with a database table
- Basic knowledge of PHP and WordPress shortcodes

## Setting Up Your Data Structure

For this tutorial, we'll create a simple product dashboard. In your Supabase database, create a `products` table with these fields:

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    seller_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Step 1: Creating the Dashboard Plugin Structure

Create a new plugin file or add to your existing theme's `functions.php`:

```php
<?php
/**
 * Custom Dashboard Plugin
 */
defined('ABSPATH') || exit;

class SupaWP_Custom_Dashboard {
    private static $initiated = false;

    public static function init() {
        if (!self::$initiated) {
            self::init_hooks();
        }
    }

    public static function init_hooks() {
        self::$initiated = true;
        add_shortcode('supawp_product_dashboard', array('SupaWP_Custom_Dashboard', 'product_dashboard_shortcode'));
    }
}

// Initialize when SupaWP is ready
add_action('supawp_init', array('SupaWP_Custom_Dashboard', 'init'));
```

## Step 2: Building the Dashboard Shortcode

Now let's create the main dashboard functionality:

```php
public static function product_dashboard_shortcode($atts) {
    $atts = shortcode_atts(array(), $atts, 'supawp_product_dashboard');

    // Get current user
    $current_user = wp_get_current_user();
    if (!$current_user->ID) {
        return '<p>Please log in to view your dashboard.</p>';
    }

    // Get user's Supabase UID
    $supabase_uid = get_user_meta($current_user->ID, 'supabase_uid', true);
    if (empty($supabase_uid)) {
        return '<p>Unable to load dashboard. Please contact support.</p>';
    }

    // Get products from Supabase
    $products = apply_filters('supawp_get_data_from_supabase', 'products', array(
        'seller_id' => 'eq.' . $supabase_uid
    ));

    if (!is_array($products)) {
        $products = array();
    }

    $product_count = count($products);

    // Start building the dashboard HTML
    ob_start();
    ?>
    <div class="supawp-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="stats-section">
                <div class="stat-item">
                    <span class="stat-number"><?php echo esc_html($product_count); ?></span>
                    <span class="stat-label">Products Listed</span>
                </div>
            </div>
            <button class="btn-add-product" onclick="addNewProduct()">
                ➕ Add New Product
            </button>
        </div>

        <!-- Products List -->
        <div class="products-section">
            <h2>Your Products</h2>

            <?php if ($product_count > 0): ?>
                <div class="products-grid">
                    <?php foreach ($products as $product): ?>
                        <div class="product-card">
                            <h3><?php echo esc_html($product['name']); ?></h3>
                            <p class="product-description">
                                <?php echo esc_html($product['description']); ?>
                            </p>
                            <p class="product-price">
                                £<?php echo esc_html(number_format($product['price'], 2)); ?>
                            </p>
                            <span class="product-status <?php echo $product['is_active'] ? 'active' : 'inactive'; ?>">
                                <?php echo $product['is_active'] ? '✅ Active' : '❌ Inactive'; ?>
                            </span>
                            <button class="btn-edit" onclick="editProduct(<?php echo esc_attr($product['id']); ?>)">
                                Edit
                            </button>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="no-products">
                    <p>No products found. Add your first product to get started!</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <style>
        /* Add your custom dashboard styles here */
        .supawp-dashboard {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Style the dashboard header, product cards, buttons, etc. */
    </style>

    <script>
        function addNewProduct() {
            alert('Add new product functionality would go here');
            // In a real implementation, this would open a form or redirect to an add product page
        }

        function editProduct(productId) {
            alert('Edit product ID: ' + productId);
            // In a real implementation, this would open an edit form
        }
    </script>
    <?php

    return ob_get_clean();
}
```

## Step 3: Using the SupaWP Data Filters

The key to SupaWP's power lies in its data filters. Here are the main ones you'll use:

### Getting Data

```php
// Get all products
$products = apply_filters('supawp_get_data_from_supabase', 'products', array());

// Get products with filters
$products = apply_filters('supawp_get_data_from_supabase', 'products', array(
    'seller_id' => 'eq.' . $user_id,
    'is_active' => 'eq.true',
    'price' => 'gte.10.00'
));
```

### Saving Data

```php
// Save new product
$product_data = array(
    'name' => 'Sample Product',
    'description' => 'A great product',
    'price' => 29.99,
    'seller_id' => $supabase_uid,
    'is_active' => true
);

$result = apply_filters('supawp_save_data_to_supabase', $product_data, 'products');
```

## Step 4: Adding Sample Data (Optional)

For testing purposes, you can create a function to add sample data:

```php
public static function create_sample_products() {
    $current_user = wp_get_current_user();
    $supabase_uid = get_user_meta($current_user->ID, 'supabase_uid', true);

    $sample_products = array(
        array(
            'name' => 'Vintage T-Shirt',
            'description' => 'Classic vintage design, 100% cotton',
            'price' => 25.99,
            'seller_id' => $supabase_uid,
            'is_active' => true
        ),
        array(
            'name' => 'Designer Jeans',
            'description' => 'Premium denim with perfect fit',
            'price' => 89.99,
            'seller_id' => $supabase_uid,
            'is_active' => true
        ),
        array(
            'name' => 'Leather Boots',
            'description' => 'Handcrafted leather boots for all seasons',
            'price' => 149.99,
            'seller_id' => $supabase_uid,
            'is_active' => false
        )
    );

    foreach ($sample_products as $product) {
        apply_filters('supawp_save_data_to_supabase', $product, 'products');
    }
}
```

## Step 5: Using Your Dashboard

Once your code is in place:

1. Add the shortcode to any page or post: `[supawp_product_dashboard]`
2. Make sure users are logged in and have a `supabase_uid` in their user meta
3. The dashboard will automatically display their products from Supabase

## Advanced Features You Can Add

### 1. Search and Filtering

```php
// Add search parameter to filter
if (!empty($_GET['search'])) {
    $filters['name'] = 'ilike.*' . sanitize_text_field($_GET['search']) . '*';
}
```

### 2. Pagination

```php
// Add limit and offset for pagination
$filters['limit'] = 10;
$filters['offset'] = ($page - 1) * 10;
```

### 3. Real-time Updates

Integrate with Supabase's real-time features to update the dashboard automatically when data changes.

## Security Considerations

1. **Always sanitize user input** using WordPress functions like `sanitize_text_field()`
2. **Verify user permissions** before displaying or modifying data
3. **Use nonces** for form submissions to prevent CSRF attacks
4. **Validate data** before sending to Supabase

## Common Supabase Query Filters

Here are some useful filter examples for SupaWP:

```php
// Exact match
'status' => 'eq.active'

// Greater than
'price' => 'gt.50'

// Less than or equal
'price' => 'lte.100'

// Text search (case insensitive)
'name' => 'ilike.*search term*'

// In array
'category' => 'in.(clothing,shoes,accessories)'

// Not equal
'status' => 'neq.deleted'

// Order by
'order' => 'created_at.desc'

// Limit results
'limit' => '10'
```

## Conclusion

Building custom dashboards with SupaWP is straightforward and powerful. The plugin handles the complex authentication and API communication with Supabase, allowing you to focus on creating great user experiences.

Key benefits of this approach:

- **No complex API calls** - SupaWP handles everything
- **Real-time data** from Supabase
- **Seamless WordPress integration**
- **User-specific data** using Supabase authentication
- **Responsive design** that works on all devices

With this foundation, you can build sophisticated dashboards for any type of data - from e-commerce products to service bookings, from content management to analytics dashboards.

## Resources

- [SupaWP Plugin Documentation](https://techcater.com/shop/products/SUPA_WP)
- [Supabase Documentation](https://supabase.com/docs)
- [WordPress Shortcode API](https://developer.wordpress.org/plugins/shortcodes/)
- [WordPress Filter Reference](https://developer.wordpress.org/reference/functions/apply_filters/)

Start building your custom dashboard today and unlock the full potential of your Supabase data in WordPress!

-- DawnWire MariaDB schema (generated 2026-08-23T10:25:03.374Z)
-- Mirrors Supabase public schema 1:1
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(36) NULL,
  `user_id` VARCHAR(36) NULL,
  `user_name` MEDIUMTEXT NULL,
  `action` MEDIUMTEXT NULL,
  `details` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_clicks` (
  `id` VARCHAR(36) NULL,
  `product_id` VARCHAR(36) NULL,
  `category_id` VARCHAR(36) NULL,
  `page_url` MEDIUMTEXT NULL,
  `page_type` MEDIUMTEXT NULL,
  `banner_id` VARCHAR(36) NULL,
  `section_type` MEDIUMTEXT NULL,
  `cta_position` MEDIUMTEXT NULL,
  `device_type` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `user_id` VARCHAR(36) NULL,
  `campaign` MEDIUMTEXT NULL,
  `article_id` VARCHAR(36) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_health` (
  `product_id` MEDIUMTEXT NULL,
  `asin` MEDIUMTEXT NULL,
  `affiliate_tag` MEDIUMTEXT NULL,
  `validation_status` MEDIUMTEXT NULL,
  `marked_for_update` TINYINT(1) NULL,
  `manual_note` MEDIUMTEXT NULL,
  `marked_by` MEDIUMTEXT NULL,
  `marked_at` VARCHAR(35) NULL,
  `last_checked_at` VARCHAR(35) NULL,
  `last_error` MEDIUMTEXT NULL,
  `checked_by` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`product_id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_link_log` (
  `id` VARCHAR(36) NULL,
  `product_id` MEDIUMTEXT NULL,
  `old_url` MEDIUMTEXT NULL,
  `new_url` MEDIUMTEXT NULL,
  `updated_by` MEDIUMTEXT NULL,
  `source` MEDIUMTEXT NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_links` (
  `id` VARCHAR(36) NULL,
  `title` MEDIUMTEXT NULL,
  `destination_url` MEDIUMTEXT NULL,
  `affiliate_url` MEDIUMTEXT NULL,
  `short_slug` MEDIUMTEXT NULL,
  `category_id` MEDIUMTEXT NULL,
  `post_id` MEDIUMTEXT NULL,
  `button_text` MEDIUMTEXT NULL,
  `disclosure_text` MEDIUMTEXT NULL,
  `no_follow` TINYINT(1) NULL,
  `sponsored` TINYINT(1) NULL,
  `open_in_new_tab` TINYINT(1) NULL,
  `click_count` INT NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `clicks_by_page` LONGTEXT NULL,
  `clicks_by_date` LONGTEXT NULL,
  `group_name` MEDIUMTEXT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_short_slug` (`short_slug`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_api_credentials` (
  `id` VARCHAR(36) NULL,
  `marketplace_code` MEDIUMTEXT NULL,
  `access_key` MEDIUMTEXT NULL,
  `secret_key` MEDIUMTEXT NULL,
  `partner_tag` MEDIUMTEXT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_marketplace_code` (`marketplace_code`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_api_usage` (
  `id` VARCHAR(36) NULL,
  `date` VARCHAR(12) NULL,
  `requests_used` INT NULL,
  `requests_limit` INT NULL,
  `earned_quota` INT NULL,
  `reset_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_marketplaces` (
  `id` VARCHAR(36) NULL,
  `code` MEDIUMTEXT NULL,
  `name` MEDIUMTEXT NULL,
  `domain` MEDIUMTEXT NULL,
  `region` MEDIUMTEXT NULL,
  `paapi_endpoint` MEDIUMTEXT NULL,
  `currency` MEDIUMTEXT NULL,
  `locale` MEDIUMTEXT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_code` (`code`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_price_history` (
  `id` VARCHAR(36) NULL,
  `product_id` MEDIUMTEXT NULL,
  `asin` MEDIUMTEXT NULL,
  `old_price` DOUBLE NULL,
  `new_price` DOUBLE NULL,
  `old_reference_price` DOUBLE NULL,
  `new_reference_price` DOUBLE NULL,
  `currency` MEDIUMTEXT NULL,
  `is_deal` TINYINT(1) NULL,
  `change_type` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_sync_logs` (
  `id` VARCHAR(36) NULL,
  `batch_id` VARCHAR(36) NULL,
  `product_id` MEDIUMTEXT NULL,
  `asin` MEDIUMTEXT NULL,
  `action` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `request_used` INT NULL,
  `response_data` LONGTEXT NULL,
  `error_message` MEDIUMTEXT NULL,
  `error_code` MEDIUMTEXT NULL,
  `duration_ms` INT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_sync_settings` (
  `id` VARCHAR(36) NULL,
  `auto_sync_enabled` TINYINT(1) NULL,
  `sync_interval_minutes` INT NULL,
  `fast_sync_interval_minutes` INT NULL,
  `deal_sync_interval_minutes` INT NULL,
  `featured_sync_interval_minutes` INT NULL,
  `batch_size` INT NULL,
  `max_requests_per_hour` INT NULL,
  `max_retries` INT NULL,
  `retry_delay_minutes` INT NULL,
  `freshness_days` INT NULL,
  `fields_to_sync` LONGTEXT NULL,
  `fields_auto_overwrite` LONGTEXT NULL,
  `notify_on_failure` TINYINT(1) NULL,
  `notify_on_price_change` TINYINT(1) NULL,
  `notify_on_availability_change` TINYINT(1) NULL,
  `notify_email` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amazon_sync_status` (
  `id` VARCHAR(36) NULL,
  `product_id` MEDIUMTEXT NULL,
  `asin` MEDIUMTEXT NULL,
  `marketplace_code` MEDIUMTEXT NULL,
  `partner_tag` MEDIUMTEXT NULL,
  `sync_status` MEDIUMTEXT NULL,
  `priority` INT NULL,
  `current_price` DOUBLE NULL,
  `current_price_updated_at` VARCHAR(35) NULL,
  `previous_price` DOUBLE NULL,
  `previous_price_updated_at` VARCHAR(35) NULL,
  `reference_price` DOUBLE NULL,
  `currency` MEDIUMTEXT NULL,
  `availability` MEDIUMTEXT NULL,
  `is_available` TINYINT(1) NULL,
  `is_deal` TINYINT(1) NULL,
  `deal_price` DOUBLE NULL,
  `deal_end_time` VARCHAR(35) NULL,
  `is_prime_deal` TINYINT(1) NULL,
  `product_title` MEDIUMTEXT NULL,
  `brand` MEDIUMTEXT NULL,
  `main_image` MEDIUMTEXT NULL,
  `additional_images` LONGTEXT NULL,
  `product_features` LONGTEXT NULL,
  `product_category` MEDIUMTEXT NULL,
  `product_url` MEDIUMTEXT NULL,
  `affiliate_url` MEDIUMTEXT NULL,
  `variations` LONGTEXT NULL,
  `last_sync_at` VARCHAR(35) NULL,
  `last_successful_sync_at` VARCHAR(35) NULL,
  `next_sync_at` VARCHAR(35) NULL,
  `sync_count` INT NULL,
  `error_count` INT NULL,
  `last_error_message` MEDIUMTEXT NULL,
  `last_error_at` VARCHAR(35) NULL,
  `is_asin_valid` TINYINT(1) NULL,
  `asin_flagged` TINYINT(1) NULL,
  `asin_flag_reason` MEDIUMTEXT NULL,
  `retry_count` INT NULL,
  `max_retries` INT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_asin` (`asin`(64)),
UNIQUE KEY `u_product_id` (`product_id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auto_article_settings` (
  `id` VARCHAR(36) NULL,
  `enabled` TINYINT(1) NULL,
  `interval_minutes` INT NULL,
  `batch_size` INT NULL,
  `daily_limit` INT NULL,
  `status` MEDIUMTEXT NULL,
  `with_image` TINYINT(1) NULL,
  `min_score` INT NULL,
  `image_model` MEDIUMTEXT NULL,
  `generated_today` INT NULL,
  `generated_date` MEDIUMTEXT NULL,
  `updated_at` VARCHAR(35) NULL,
  `image_api_key` MEDIUMTEXT NULL,
  `image_provider` MEDIUMTEXT NULL,
  `image_account_id` MEDIUMTEXT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brands` (
  `id` MEDIUMTEXT NULL,
  `name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `logo_url` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bulk_import_jobs` (
  `id` VARCHAR(36) NULL,
  `source` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `total_items` INT NULL,
  `processed_items` INT NULL,
  `succeeded` INT NULL,
  `failed` INT NULL,
  `skipped` INT NULL,
  `params` LONGTEXT NULL,
  `result` LONGTEXT NULL,
  `error_message` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` MEDIUMTEXT NULL,
  `name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `parent_id` MEDIUMTEXT NULL,
  `parentId` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` MEDIUMTEXT NULL,
  `createdAt` MEDIUMTEXT NULL,
  `image` MEDIUMTEXT NULL,
  `icon` MEDIUMTEXT NULL,
  `desktop_banner` MEDIUMTEXT NULL,
  `mobile_banner` MEDIUMTEXT NULL,
  `animation_style` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64)),
INDEX `idx_cat_slug` (`slug`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_banners` (
  `id` VARCHAR(36) NULL,
  `category_id` VARCHAR(36) NULL,
  `desktop_image` MEDIUMTEXT NULL,
  `mobile_image` MEDIUMTEXT NULL,
  `heading` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `cta_text` MEDIUMTEXT NULL,
  `cta_link` MEDIUMTEXT NULL,
  `alt_text` MEDIUMTEXT NULL,
  `sort_order` INT NULL,
  `start_date` VARCHAR(35) NULL,
  `end_date` VARCHAR(35) NULL,
  `is_active` TINYINT(1) NULL,
  `is_archived` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_sections` (
  `id` VARCHAR(36) NULL,
  `category_id` VARCHAR(36) NULL,
  `section_type` MEDIUMTEXT NULL,
  `title` MEDIUMTEXT NULL,
  `subtitle` MEDIUMTEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `settings` LONGTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(36) NULL,
  `post_id` VARCHAR(36) NULL,
  `user_id` VARCHAR(36) NULL,
  `parent_id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `email` MEDIUMTEXT NULL,
  `content` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `likes_count` INT NULL,
  `liked_by` LONGTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comparison_tables` (
  `id` VARCHAR(36) NULL,
  `title` MEDIUMTEXT NULL,
  `products` LONGTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_briefs` (
  `id` VARCHAR(36) NULL,
  `main_keyword` MEDIUMTEXT NULL,
  `search_intent` MEDIUMTEXT NULL,
  `target_audience` MEDIUMTEXT NULL,
  `suggested_title` MEDIUMTEXT NULL,
  `suggested_slug` MEDIUMTEXT NULL,
  `suggested_headings` LONGTEXT NULL,
  `faqs` LONGTEXT NULL,
  `internal_links` LONGTEXT NULL,
  `affiliate_links` LONGTEXT NULL,
  `competitor_notes` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `assigned_writer` MEDIUMTEXT NULL,
  `due_date` VARCHAR(35) NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deals` (
  `id` VARCHAR(36) NULL,
  `product_id` VARCHAR(36) NULL,
  `sale_price` DOUBLE NULL,
  `regular_price` DOUBLE NULL,
  `discount_percentage` INT NULL,
  `start_date` VARCHAR(35) NULL,
  `end_date` VARCHAR(35) NULL,
  `is_featured` TINYINT(1) NULL,
  `deal_type` MEDIUMTEXT NULL,
  `category_id` VARCHAR(36) NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `error_404_logs` (
  `id` VARCHAR(36) NULL,
  `url` MEDIUMTEXT NULL,
  `referrer` MEDIUMTEXT NULL,
  `hit_count` INT NULL,
  `first_seen` VARCHAR(35) NULL,
  `last_seen` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_products` (
  `id` VARCHAR(36) NULL,
  `event_id` VARCHAR(36) NULL,
  `product_id` MEDIUMTEXT NULL,
  `sort_order` INT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
INDEX `idx_ep_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faq_items` (
  `id` VARCHAR(36) NULL,
  `question` MEDIUMTEXT NULL,
  `answer` MEDIUMTEXT NULL,
  `display_order` INT NULL,
  `schema_enabled` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `homepage_hero_slides` (
  `id` VARCHAR(36) NULL,
  `desktop_image` MEDIUMTEXT NULL,
  `mobile_image` MEDIUMTEXT NULL,
  `heading` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `cta_text` MEDIUMTEXT NULL,
  `cta_link` MEDIUMTEXT NULL,
  `alt_text` MEDIUMTEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
  `image_only` TINYINT(1) NULL,
  `placement` MEDIUMTEXT NULL,
  `badge_text` MEDIUMTEXT NULL,
  `title` MEDIUMTEXT NULL,
  `subtitle` MEDIUMTEXT NULL,
  `start_date` VARCHAR(35) NULL,
  `end_date` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
INDEX `idx_hhs_placement` (`placement`(64), `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `homepage_sections` (
  `id` VARCHAR(36) NULL,
  `section_type` MEDIUMTEXT NULL,
  `title` MEDIUMTEXT NULL,
  `subtitle` MEDIUMTEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `settings` LONGTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `internal_links` (
  `id` VARCHAR(36) NULL,
  `source_id` VARCHAR(36) NULL,
  `source_type` MEDIUMTEXT NULL,
  `target_id` VARCHAR(36) NULL,
  `target_type` MEDIUMTEXT NULL,
  `anchor_text` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `keywords` (
  `id` VARCHAR(36) NULL,
  `keyword` MEDIUMTEXT NULL,
  `page_id` VARCHAR(36) NULL,
  `page_type` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `search_intent` MEDIUMTEXT NULL,
  `difficulty` INT NULL,
  `monthly_volume` INT NULL,
  `content_type` MEDIUMTEXT NULL,
  `notes` MEDIUMTEXT NULL,
  `related_keywords` LONGTEXT NULL,
  `internal_link_target` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media` (
  `id` VARCHAR(36) NULL,
  `file_name` MEDIUMTEXT NULL,
  `url` MEDIUMTEXT NULL,
  `mime_type` MEDIUMTEXT NULL,
  `size` INT NULL,
  `created_at` VARCHAR(35) NULL,
  `alt_text` MEDIUMTEXT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `email` MEDIUMTEXT NULL,
  `subject` MEDIUMTEXT NULL,
  `message` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `status` MEDIUMTEXT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` VARCHAR(36) NULL,
  `email` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `user_id` VARCHAR(36) NULL,
  `deal_alerts` TINYINT(1) NULL,
  `price_drop_alerts` TINYINT(1) NULL,
  `weekly_digest` TINYINT(1) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_email` (`email`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` VARCHAR(36) NULL,
  `title` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `content` MEDIUMTEXT NULL,
  `featured_image` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `seo_title` MEDIUMTEXT NULL,
  `seo_description` MEDIUMTEXT NULL,
  `focus_keyword` MEDIUMTEXT NULL,
  `canonical_url` MEDIUMTEXT NULL,
  `robots_index` TINYINT(1) NULL,
  `robots_follow` TINYINT(1) NULL,
  `og_title` MEDIUMTEXT NULL,
  `og_description` MEDIUMTEXT NULL,
  `og_image` MEDIUMTEXT NULL,
  `twitter_title` MEDIUMTEXT NULL,
  `twitter_description` MEDIUMTEXT NULL,
  `twitter_image` MEDIUMTEXT NULL,
  `schema_type` MEDIUMTEXT NULL,
  `schema_enabled` TINYINT(1) NULL,
  `breadcrumbs_hide` TINYINT(1) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_slug` (`slug`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `page_views` (
  `id` VARCHAR(36) NULL,
  `path` MEDIUMTEXT NULL,
  `referrer` MEDIUMTEXT NULL,
  `user_agent` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `ip` VARCHAR(64) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
KEY `idx_page_views_created` (`created_at`),
KEY `idx_page_views_path` (`path`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `topic_clusters` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `pillar_page_id` VARCHAR(36) NULL,
  `pillar_page_slug` MEDIUMTEXT NULL,
  `pillar_page_title` MEDIUMTEXT NULL,
  `cluster_post_ids` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portfolio_projects` (
  `id` VARCHAR(36) NULL,
  `title` MEDIUMTEXT NULL,
  `client` MEDIUMTEXT NULL,
  `industry` MEDIUMTEXT NULL,
  `service_type` MEDIUMTEXT NULL,
  `image` MEDIUMTEXT NULL,
  `short_description` MEDIUMTEXT NULL,
  `problem` MEDIUMTEXT NULL,
  `solution` MEDIUMTEXT NULL,
  `results` MEDIUMTEXT NULL,
  `tools_used` LONGTEXT NULL,
  `website_url` MEDIUMTEXT NULL,
  `gallery` LONGTEXT NULL,
  `testimonial` LONGTEXT NULL,
  `cta_text` MEDIUMTEXT NULL,
  `featured` TINYINT(1) NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
  `slug` MEDIUMTEXT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` MEDIUMTEXT NULL,
  `title` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `excerpt` MEDIUMTEXT NULL,
  `content` MEDIUMTEXT NULL,
  `category_id` MEDIUMTEXT NULL,
  `categoryId` MEDIUMTEXT NULL,
  `author_id` MEDIUMTEXT NULL,
  `authorId` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `visibility` MEDIUMTEXT NULL,
  `published_at` MEDIUMTEXT NULL,
  `publishedAt` MEDIUMTEXT NULL,
  `created_at` MEDIUMTEXT NULL,
  `createdAt` MEDIUMTEXT NULL,
  `updated_at` MEDIUMTEXT NULL,
  `updatedAt` MEDIUMTEXT NULL,
  `featured_image` MEDIUMTEXT NULL,
  `featuredImage` MEDIUMTEXT NULL,
  `seo_title` MEDIUMTEXT NULL,
  `seoTitle` MEDIUMTEXT NULL,
  `seo_description` MEDIUMTEXT NULL,
  `seoDescription` MEDIUMTEXT NULL,
  `seo_keywords` MEDIUMTEXT NULL,
  `tags` LONGTEXT NULL,
  `allowComments` TINYINT(1) NULL,
  `allow_comments` TINYINT(1) NULL,
  `isEditorsPick` TINYINT(1) NULL,
  `isFeatured` TINYINT(1) NULL,
  `isTrending` TINYINT(1) NULL,
  `readingTime` DOUBLE NULL,
  `product_id` MEDIUMTEXT NULL,
  `featured_image_alt` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64)),
INDEX `idx_posts_slug` (`slug`(64)),
INDEX `idx_posts_status` (`status`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `price_alerts` (
  `id` MEDIUMTEXT NULL,
  `user_id` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `email` MEDIUMTEXT NULL,
  `product_id` MEDIUMTEXT NULL,
  `target_price` DOUBLE NULL,
  `current_price` DOUBLE NULL,
  `alert_type` MEDIUMTEXT NULL,
  `is_triggered` TINYINT(1) NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` MEDIUMTEXT NULL,
  `triggered_at` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` MEDIUMTEXT NULL,
  `product_name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `brand` MEDIUMTEXT NULL,
  `category_id` MEDIUMTEXT NULL,
  `price` MEDIUMTEXT NULL,
  `original_price` MEDIUMTEXT NULL,
  `rating` DOUBLE NULL,
  `review_count` DOUBLE NULL,
  `affiliate_url` MEDIUMTEXT NULL,
  `product_image` MEDIUMTEXT NULL,
  `pros` LONGTEXT NULL,
  `cons` LONGTEXT NULL,
  `best_for` MEDIUMTEXT NULL,
  `verdict` MEDIUMTEXT NULL,
  `ai_verdict` LONGTEXT NULL,
  `score_breakdown` LONGTEXT NULL,
  `specs` LONGTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `published_at` MEDIUMTEXT NULL,
  `deal_badge` MEDIUMTEXT NULL,
  `coupon_code` MEDIUMTEXT NULL,
  `coupon_expiry` MEDIUMTEXT NULL,
  `alternative_stores` LONGTEXT NULL,
  `editor_score` DOUBLE NULL,
  `final_verdict` MEDIUMTEXT NULL,
  `cta_text` MEDIUMTEXT NULL,
  `key_features` LONGTEXT NULL,
  `asin` MEDIUMTEXT NULL,
  `amazon_url` MEDIUMTEXT NULL,
  `stock_status` MEDIUMTEXT NULL,
  `gallery` LONGTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
  `click_count` INT NULL,
  `page_views` INT NULL,
  `is_featured` TINYINT(1) NULL,
  `is_deal` TINYINT(1) NULL,
  `seo_title` MEDIUMTEXT NULL,
  `seo_description` MEDIUMTEXT NULL,
  `seo_keywords` MEDIUMTEXT NULL,
  `discount_percentage` INT NULL,
  `features` LONGTEXT NULL,
  `technical_specs` LONGTEXT NULL,
  `shipping_info` MEDIUMTEXT NULL,
  `editor_rating` INT NULL,
  `price_updated_at` VARCHAR(35) NULL,
  `last_updated_at` VARCHAR(35) NULL,
  `variants` LONGTEXT NULL,
  `comparison_attributes` LONGTEXT NULL,
  `is_trending` TINYINT(1) NULL,
  `is_top_rated` TINYINT(1) NULL,
  `review_summary` MEDIUMTEXT NULL,
  `brand_id` MEDIUMTEXT NULL,
  `subcategory_id` MEDIUMTEXT NULL,
  `review_article` MEDIUMTEXT NULL,
  `faq` LONGTEXT NULL,
  `affiliate_disclosure` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64)),
INDEX `idx_pr_slug` (`slug`(64)),
INDEX `idx_pr_status_cat` (`status`(64), `category_id`(64)),
INDEX `idx_pr_score` (`editor_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recently_viewed` (
  `id` MEDIUMTEXT NULL,
  `user_id` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `product_id` MEDIUMTEXT NULL,
  `viewed_at` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `redirects` (
  `id` VARCHAR(36) NULL,
  `source_url` MEDIUMTEXT NULL,
  `target_url` MEDIUMTEXT NULL,
  `status_code` INT NULL,
  `hit_count` INT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_source_url` (`source_url`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_comparisons` (
  `id` MEDIUMTEXT NULL,
  `user_id` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `product_ids` LONGTEXT NULL,
  `created_at` MEDIUMTEXT NULL,
  `title` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `search_logs` (
  `id` VARCHAR(36) NULL,
  `query` MEDIUMTEXT NULL,
  `category_id` VARCHAR(36) NULL,
  `results_count` INT NULL,
  `has_results` TINYINT(1) NULL,
  `session_id` MEDIUMTEXT NULL,
  `user_id` VARCHAR(36) NULL,
  `clicked_product_id` VARCHAR(36) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(36) NULL,
  `title` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `icon` MEDIUMTEXT NULL,
  `overview` MEDIUMTEXT NULL,
  `includes` LONGTEXT NULL,
  `process` LONGTEXT NULL,
  `benefits` LONGTEXT NULL,
  `faqs` LONGTEXT NULL,
  `cta_text` MEDIUMTEXT NULL,
  `cta_url` MEDIUMTEXT NULL,
  `featured` TINYINT(1) NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_slug` (`slug`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` VARCHAR(36) NULL,
  `site_name` MEDIUMTEXT NULL,
  `site_tagline` MEDIUMTEXT NULL,
  `logo_url` MEDIUMTEXT NULL,
  `favicon_url` MEDIUMTEXT NULL,
  `default_language` MEDIUMTEXT NULL,
  `posts_per_page` INT NULL,
  `enable_comments` TINYINT(1) NULL,
  `allow_guest_comments` TINYINT(1) NULL,
  `require_comment_approval` TINYINT(1) NULL,
  `affiliate_disclosure_text` MEDIUMTEXT NULL,
  `primary_color` MEDIUMTEXT NULL,
  `secondary_color` MEDIUMTEXT NULL,
  `header_menu` LONGTEXT NULL,
  `footer_columns` LONGTEXT NULL,
  `social_links` LONGTEXT NULL,
  `updated_at` VARCHAR(35) NULL,
  `seo_title` MEDIUMTEXT NULL,
  `seo_description` MEDIUMTEXT NULL,
  `seo_keywords` MEDIUMTEXT NULL,
  `og_title` MEDIUMTEXT NULL,
  `og_description` MEDIUMTEXT NULL,
  `og_image` MEDIUMTEXT NULL,
  `twitter_card` MEDIUMTEXT NULL,
  `analytics_ga_id` MEDIUMTEXT NULL,
  `analytics_gtm_id` MEDIUMTEXT NULL,
  `search_console_verification` MEDIUMTEXT NULL,
  `meta_pixel_id` MEDIUMTEXT NULL,
  `custom_head_scripts` MEDIUMTEXT NULL,
  `custom_footer_scripts` MEDIUMTEXT NULL,
  `sitemap_enabled` TINYINT(1) NULL,
  `sitemap_include_posts` TINYINT(1) NULL,
  `sitemap_include_pages` TINYINT(1) NULL,
  `sitemap_include_categories` TINYINT(1) NULL,
  `robots_content` MEDIUMTEXT NULL,
  `lazy_load_images` TINYINT(1) NULL,
  `preload_featured_image` TINYINT(1) NULL,
  `breadcrumbs_enabled` TINYINT(1) NULL,
  `breadcrumbs_separator` MEDIUMTEXT NULL,
  `outdated_threshold_days` INT NULL,
  `auto_affiliate_disclaimer` TINYINT(1) NULL,
  `design_settings` LONGTEXT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shopping_events` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
  `tagline` MEDIUMTEXT NULL,
  `description` MEDIUMTEXT NULL,
  `emoji` MEDIUMTEXT NULL,
  `hero_image` MEDIUMTEXT NULL,
  `theme_color` MEDIUMTEXT NULL,
  `start_date` VARCHAR(12) NULL,
  `end_date` VARCHAR(12) NULL,
  `is_active` TINYINT(1) NULL,
  `featured` TINYINT(1) NULL,
  `sort_order` INT NULL,
  `keywords` MEDIUMTEXT NULL,
  `seo_title` MEDIUMTEXT NULL,
  `seo_description` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_slug` (`slug`(64)),
INDEX `idx_se_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_media_credentials` (
  `id` MEDIUMTEXT NULL,
  `platform` MEDIUMTEXT NULL,
  `access_token` MEDIUMTEXT NULL,
  `page_id` MEDIUMTEXT NULL,
  `board_id` MEDIUMTEXT NULL,
  `profile_name` MEDIUMTEXT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_media_posts` (
  `id` MEDIUMTEXT NULL,
  `product_id` MEDIUMTEXT NULL,
  `platform` MEDIUMTEXT NULL,
  `caption` MEDIUMTEXT NULL,
  `image_url` MEDIUMTEXT NULL,
  `link` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `platform_post_id` MEDIUMTEXT NULL,
  `error_message` MEDIUMTEXT NULL,
  `published_at` VARCHAR(35) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `slug` MEDIUMTEXT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_slug` (`slug`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `role` MEDIUMTEXT NULL,
  `company` MEDIUMTEXT NULL,
  `text` MEDIUMTEXT NULL,
  `rating` INT NULL,
  `avatar_url` MEDIUMTEXT NULL,
  `display_order` INT NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
  `updated_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NULL,
  `name` MEDIUMTEXT NULL,
  `email` MEDIUMTEXT NULL,
  `role` MEDIUMTEXT NULL,
  `avatar` MEDIUMTEXT NULL,
  `bio` MEDIUMTEXT NULL,
  `status` MEDIUMTEXT NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_email` (`email`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` MEDIUMTEXT NULL,
  `user_id` MEDIUMTEXT NULL,
  `session_id` MEDIUMTEXT NULL,
  `product_id` MEDIUMTEXT NULL,
  `added_at` MEDIUMTEXT NULL,
PRIMARY KEY (`id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` VARCHAR(36) NULL,
  `user_id` VARCHAR(36) NULL,
  `session_id` MEDIUMTEXT NULL,
  `product_id` VARCHAR(36) NULL,
  `created_at` VARCHAR(35) NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `u_product_id` (`product_id`),
UNIQUE KEY `u_user_id` (`user_id`),
UNIQUE KEY `u_session_id` (`session_id`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


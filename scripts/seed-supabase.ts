import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

if (!process.env.SUPABASE_DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL environment variable is required');
  console.error('Usage: SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres npx tsx scripts/seed-supabase.ts');
  process.exit(1);
}

async function seed() {
  console.log('Seeding Supabase data...');

  // Ensure pgcrypto extension for password hashing
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  // 1. Create auth users + profiles
  const users = [
    { id: 'a0000000-0000-0000-0000-000000000001', name: 'Sarah Jenkins', email: 'admin@dawnwire.com', role: 'super_admin', password: 'admin123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      bio: 'Sarah Jenkins is the Editor-in-Chief and technology journalist with 10+ years of experience in tech publishing.' },
    { id: 'a0000000-0000-0000-0000-000000000002', name: 'Alex Rivera', email: 'editor@dawnwire.com', role: 'editor', password: 'editor123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      bio: 'Alex Rivera is a travel blogger, digital nomad, and gadget enthusiast who loves testing gear on the road.' }
  ];

  for (const u of users) {
    // Upsert auth user
    const existing = await pool.query('SELECT id FROM auth.users WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_sent_at, is_sso_user, deleted_at)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, crypt($3, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', $4::jsonb, NOW(), NOW(), NOW(), FALSE, NULL)`,
        [u.id, u.email, u.password, JSON.stringify({ name: u.name })]
      );
    }

    // Upsert profile
    await pool.query(
      `INSERT INTO public.users (id, name, email, role, avatar, bio, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET name = $2, role = $4, avatar = $5, bio = $6`,
      [u.id, u.name, u.email, u.role, u.avatar, u.bio]
    );
    console.log(`  User: ${u.email} (${u.role})`);
  }

  // 2. Categories
  const categories = [
    { name: 'Technology', slug: 'technology', description: 'Latest news, trends, and tutorials in software, gadgets, and AI.' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Digital nomad culture, productivity tips, and personal growth.' },
    { name: 'SEO & Marketing', slug: 'seo-marketing', description: 'Guides, tips, and strategies for climbing search engine rankings.' },
    { name: 'Business', slug: 'business', description: 'Startup news, finance, management, and entrepreneurial growth.' }
  ];

  for (const cat of categories) {
    await pool.query(
      `INSERT INTO public.categories (name, slug, description, status) VALUES ($1, $2, $3, 'active') ON CONFLICT (slug) DO NOTHING`,
      [cat.name, cat.slug, cat.description]
    );
  }
  console.log(`  Categories: ${categories.length}`);

  // 3. Tags
  const tags = [
    { name: 'AI', slug: 'ai' }, { name: 'Software', slug: 'software' },
    { name: 'Digital Nomad', slug: 'digital-nomad' }, { name: 'SEO', slug: 'seo' },
    { name: 'Productivity', slug: 'productivity' }, { name: 'Gear', slug: 'gear' }
  ];
  for (const tag of tags) {
    await pool.query(
      `INSERT INTO public.tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [tag.name, tag.slug]
    );
  }
  console.log(`  Tags: ${tags.length}`);

  // 4. Get IDs
  const { rows: catRows } = await pool.query('SELECT slug, id FROM public.categories');
  const catMap: Record<string, string> = {};
  for (const r of catRows) catMap[r.slug] = r.id;

  // 5. Posts
  const posts = [
    {
      title: 'The Future of AI Content Generation: Balancing Scale and Authenticity',
      slug: 'future-of-ai-content-generation',
      excerpt: 'Explore how AI models are changing the content creation landscape, and why maintaining a human-in-the-loop approach is critical for long-term SEO and reader trust.',
      content: `## The Explosion of Generative AI\n\nIn the past few years, artificial intelligence has fundamentally disrupted how we think about writing, marketing, and content strategy. With models like Gemini 3.5 capable of drafting structured, readable articles in seconds, the temptation to scale content production infinitely is higher than ever.\n\nHowever, content strategy is undergoing a silent counter-revolution. Search engines and readers alike are becoming increasingly sophisticated at spotting "AI slop"—generic, low-value, repetitive content that serves only to populate keyword pages.\n\n---\n\n## Why "Pure AI" content fails the SEO test\n\nWhile AI tools are excellent writing assistants, publishing raw AI-generated content without human curation presents significant risks:\n\n1. **Lack of Originality (E-E-A-T):** Search engines prioritize **Experience, Expertise, Authoritativeness, and Trustworthiness**. An AI model synthesizes existing web data; it cannot provide first-hand experience, take unique product photos, or conduct real-world tests.\n2. **Fact and Detail Hallucinations:** AI models can confidently invent statistics or technical facts, destroying your blog\\'s editorial credibility.\n3. **Flat, Monotonous Voice:** Generative writing often lacks the rhythm, wit, and emotional resonance of a professional human writer.\n\n> **Pro Tip:** Use AI as an accelerator, not an author. Use it to outline ideas, brainstorm hooks, and summarize research—but let a human write the core arguments.\n\n---\n\n## The Hybrid Approach: Human-in-the-Loop Content Production\n\nTo scale production while maintaining maximum content standards, consider the following blueprint:\n\n### 1. Advanced Research Grounding\nBefore drafting, use search-grounded models to gather real-time data, verified statistics, and citation sources. This ensures your article is rooted in accurate, timely information.\n\n### 2. The Narrative Outline\nDevelop a structured skeleton. Ensure there is a compelling hook, a clear body with actionable data, and a conclusive call-to-action that reinforces the core thesis.\n\n### 3. Human Editorial Review\nEvery article published must go through an experienced editor who verifies claims, adds personal anecdotes, inserts custom screenshots, and adjusts the tonal voice to match the brand voice.`,
      featured_image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800',
      category_slug: 'technology',
      is_featured: true, is_trending: true, tags: ['ai', 'software', 'productivity'],
      author_email: 'admin@dawnwire.com',
      published_days_ago: 2
    },
    {
      title: 'Top 10 Essential Gadgets for Modern Digital Nomads',
      slug: 'top-10-gadgets-digital-nomads',
      excerpt: 'From high-speed portable routers to ergonomic folding stands, here is a curated list of tested gear that will supercharge your remote work setup from anywhere.',
      content: `## Designing the Ultimate Portable Office\n\nFor a digital nomad, your workspace isn\\'t a room—it is your backpack. Every single ounce of weight matters, and every piece of gear must earn its spot by delivering absolute reliability, versatility, and performance.\n\nWhether you are working from a bustling cafe in Tokyo, a beachside villa in Bali, or a quiet cabin in the Pacific Northwest, here are the top gadgets that will revolutionize your remote work productivity.\n\n---\n\n## 1. Portable Multi-Screen Monitors\nWorking on a single 13-inch laptop screen can severely throttle your multitasking speed. USB-C powered portable monitors have become incredibly lightweight and high-resolution, giving you a full multi-screen productivity experience on any standard cafe table.`,
      featured_image: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=800',
      category_slug: 'lifestyle',
      is_trending: true, is_editors_pick: true,
      tags: ['digital-nomad', 'gear', 'productivity'],
      author_email: 'editor@dawnwire.com',
      published_days_ago: 5
    },
    {
      title: 'Unlocking Organic Reach: The Complete SEO Checklist for Bloggers',
      slug: 'complete-seo-checklist-bloggers',
      excerpt: 'Master the fundamentals of modern SEO, search intent, schema markup, and site structure to attract consistent, high-value organic traffic to your articles.',
      content: `## The Modern Search Landscape\n\nMany bloggers believe that writing high-quality content is enough to attract a massive audience. While excellent writing is a core requirement, the reality is that search algorithms are the main gateway to sustainable visibility.\n\n---\n\n## The On-Page SEO Checklist\n\n### 1. Title and Header Hierarchy\n*   **The H1 Title:** Must contain your primary focus keyword and be under 60 characters.\n*   **Subheadings (H2, H3):** Use clean, nested heading structures.\n\n### 2. The Power of Meta Descriptions\nYour meta description is your billboard in the search results page. Write a highly compelling 140-160 character snippet.`,
      featured_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      category_slug: 'seo-marketing',
      tags: ['seo', 'software', 'productivity'],
      author_email: 'admin@dawnwire.com',
      published_days_ago: 0
    }
  ];

  for (const p of posts) {
    const { rows: authorRows } = await pool.query('SELECT id FROM public.users WHERE email = $1', [p.author_email]);
    if (authorRows.length === 0) continue;
    const publishedAt = new Date(Date.now() - p.published_days_ago * 86400000).toISOString();
    await pool.query(
      `INSERT INTO public.posts (slug, title, excerpt, content, featured_image, author_id, category_id, tags, status, visibility, published_at, created_at, updated_at, reading_time, is_featured, is_trending, is_editors_pick, allow_comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', 'public', $9, $9, $9, $10, $11, $12, $13, TRUE)
       ON CONFLICT (slug) DO NOTHING`,
      [
        p.slug, p.title, p.excerpt, p.content, p.featured_image,
        authorRows[0].id, catMap[p.category_slug] || '', p.tags,
        publishedAt, Math.max(1, Math.round(p.content.split(/\s+/).length / 200)),
        !!p.is_featured, !!p.is_trending, !!p.is_editors_pick
      ]
    );
  }
  console.log(`  Posts: ${posts.length}`);

  // 6. Get post IDs
  const { rows: postRows } = await pool.query('SELECT slug, id FROM public.posts');
  const postMap: Record<string, string> = {};
  for (const r of postRows) postMap[r.slug] = r.id;

  // 7. Comments
  const comments = [
    { post_slug: 'future-of-ai-content-generation', name: 'Jessica Miller', email: 'jessica@techcorp.com',
      content: 'This hybrid human-in-the-loop strategy is exactly what we have implemented. Our traffic recovered significantly after adding expert review boxes!',
      likes_count: 5 },
    { post_slug: 'future-of-ai-content-generation', name: 'Sarah Jenkins', email: 'admin@dawnwire.com', user_email: 'admin@dawnwire.com',
      content: 'Absolutely! Adding authentic expert perspectives is the single best shield against algorithm updates.',
      likes_count: 2 },
    { post_slug: 'future-of-ai-content-generation', name: 'John Doe', email: 'john@gmail.com',
      content: 'Can you recommend any tools to check for AI content?' },
    { post_slug: 'top-10-gadgets-digital-nomads', name: 'Marcus Brody', email: 'marcus@brody.io',
      content: 'I bought that GaN charger last month and it has changed my life. Literally replaced 4 separate heavy power adapters.',
      likes_count: 4 },
    { post_slug: 'future-of-ai-content-generation', name: 'Spammy Sam', email: 'sam@spam.com',
      content: 'MAKE $5000 A DAY FROM YOUR HOME!!! CLICK HERE FOR SECRET MONEY METHOD',
      status: 'spam' }
  ];

  const commentIds: string[] = [];
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    const postId = postMap[c.post_slug];
    if (!postId) continue;
    let userId = null;
    if (c.user_email) {
      const { rows } = await pool.query('SELECT id FROM public.users WHERE email = $1', [c.user_email]);
      if (rows.length > 0) userId = rows[0].id;
    }
    const { rows } = await pool.query(
      `INSERT INTO public.comments (post_id, parent_id, name, email, user_id, content, status, likes_count, liked_by, created_at)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, '{}', $8) RETURNING id`,
      [postId, c.name, c.email, userId, c.content, c.status || 'approved', c.likes_count || 0, new Date(Date.now() - (i * 3600000)).toISOString()]
    );
    if (rows.length > 0) commentIds.push(rows[0].id);
  }
  console.log(`  Comments: ${comments.length}`);

  // 8. Affiliate links
  await pool.query(
    `INSERT INTO public.affiliate_links (title, destination_url, affiliate_url, short_slug, button_text, disclosure_text, no_follow, sponsored, click_count, status)
     VALUES
     ('DawnWire Travel Hub Pro (GaN Charger & Router)', 'https://amazon.com/example-travel-hub', 'https://amazon.com/example-travel-hub?tag=dawnwire-20', 'travel-hub', 'Buy on Amazon', 'As an Amazon Associate, we earn a small commission from qualifying purchases.', TRUE, TRUE, 124, 'active'),
     ('Semrush SEO Tool', 'https://semrush.com', 'https://semrush.sjv.io/dawnwire', 'semrush', 'Start Free Trial', 'We partner with Semrush to offer exclusive free trials.', TRUE, TRUE, 45, 'active')
     ON CONFLICT (short_slug) DO NOTHING`
  );
  console.log('  Affiliate Links: 2');

  // 9. Pages
  await pool.query(
    `INSERT INTO public.pages (slug, title, content, status, seo_title, seo_description) VALUES
     ('about', 'About Us', '## Welcome to DawnWire\n\nDawnWire is a premium technology brand.', 'published', 'About DawnWire', 'Learn about DawnWire.'),
     ('privacy-policy', 'Privacy Policy', '## Privacy Policy\n\nAt DawnWire, your privacy is extremely important to us.', 'published', 'Privacy Policy', 'Read our privacy policy.')
     ON CONFLICT (slug) DO NOTHING`
  );
  console.log('  Pages: 2');

  // 10. Settings
  const { rows: existingSettings } = await pool.query('SELECT id FROM public.settings LIMIT 1');
  if (existingSettings.length === 0) {
    await pool.query(
      `INSERT INTO public.settings (id, site_name, site_tagline, enable_comments, allow_guest_comments, affiliate_disclosure_text, header_menu, footer_columns, social_links)
        VALUES (gen_random_uuid(), 'DawnWire', 'Technology that helps businesses grow.', TRUE, TRUE,
       'This article may contain affiliate links. If you buy through these links, we may earn a small commission at no extra cost to you.',
       $1::jsonb, $2::jsonb, $3::jsonb)`,
      [
        JSON.stringify([{ label: 'Home', url: '/' }, { label: 'About', url: '/#/page/about' }, { label: 'Contact', url: '/#/contact' }]),
        JSON.stringify([{ title: 'Platform', links: [{ label: 'Home', url: '/' }, { label: 'About Us', url: '/#/page/about' }] }, { title: 'Legal', links: [{ label: 'Privacy Policy', url: '/#/page/privacy-policy' }] }]),
        JSON.stringify([{ platform: 'Twitter', url: 'https://twitter.com' }, { platform: 'GitHub', url: 'https://github.com' }])
      ]
    );
  }
  console.log('  Settings: 1');

  // 11. Media
  const { rows: existingMedia } = await pool.query('SELECT id FROM public.media LIMIT 1');
  if (existingMedia.length === 0) {
    await pool.query(
      `INSERT INTO public.media (file_name, url, mime_type, size) VALUES
       ('ai-future.png', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800', 'image/png', 45670),
       ('nomad-setup.png', 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=800', 'image/png', 51240)`
    );
    console.log('  Media: 2');
  } else {
    console.log('  Media: already exists, skipping');
  }

  // 12. Newsletter subscriber
  const { rows: existingSub } = await pool.query('SELECT id FROM public.newsletter_subscribers LIMIT 1');
  if (existingSub.length === 0) {
    await pool.query(`INSERT INTO public.newsletter_subscribers (email) VALUES ('subscriber@gmail.com')`);
    console.log('  Newsletter subscriber: 1');
  }

  // 13. Contact message
  const { rows: existingMsg } = await pool.query('SELECT id FROM public.messages LIMIT 1');
  if (existingMsg.length === 0) {
    await pool.query(
      `INSERT INTO public.messages (name, email, subject, message, status) VALUES
       ('Robert Carter', 'robert@marketing.net', 'Advertising Sponsorship Query', 'Hi team, I represent an ergonomic workspace brand. We are looking to sponsor an upcoming post.', 'unread')`
    );
    console.log('  Contact message: 1');
  }

  console.log('\nSeed complete!');
}

seed().catch(console.error).finally(() => pool.end());

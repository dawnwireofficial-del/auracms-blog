import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, Post, Category, Tag, Comment, AffiliateLink, 
  Page, SiteSettings, MediaItem, ContactMessage, 
  NewsletterSubscriber, ActivityLog, ContentUpgrade, TopicCluster 
} from '../../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>;
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  comments: Comment[];
  affiliateLinks: AffiliateLink[];
  pages: Page[];
  settings: SiteSettings;
  media: MediaItem[];
  messages: ContactMessage[];
  newsletter: NewsletterSubscriber[];
  logs: ActivityLog[];
  contentUpgrades: ContentUpgrade[];
  topicClusters: TopicCluster[];
  recentlyViewed: any[];
  savedComparisons: any[];
  wishlist: any[];
}

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

function getInitialDB(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'user-atif-admin',
      name: 'Atif',
      email: 'atif@dawnwire.com',
      role: 'super_admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      bio: 'Atif is the Founder and Administrator of DawnWire.',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-admin',
      name: 'Sarah Jenkins',
      email: 'admin@dawnwire.com',
      role: 'super_admin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      bio: 'Sarah Jenkins is the Editor-in-Chief and technology journalist with 10+ years of experience in tech publishing.',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-editor',
      name: 'Alex Rivera',
      email: 'editor@dawnwire.com',
      role: 'editor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      bio: 'Alex Rivera is a travel blogger, digital nomad, and gadget enthusiast who loves testing gear on the road.',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const passwords: Record<string, string> = {
    'user-atif-admin': '$2b$10$6G9rIOvyFkz9/KPr2W4quOGtAG8QIblu.a44ZWhvCTOV28Xg0Wh7u',
    'user-admin': '$2b$10$6G9rIOvyFkz9/KPr2W4quOGtAG8QIblu.a44ZWhvCTOV28Xg0Wh7u',
    'user-editor': '$2b$12$tayhp80k0fdRYM3UMj23TOSkdQYIcfAIAKEMuFR/vMHLP.95cAEEu'
  };

  const categories: Category[] = [
    { id: 'cat-tech', name: 'Technology', slug: 'technology', description: 'Latest news, trends, and tutorials in software, gadgets, and AI.', status: 'active' },
    { id: 'cat-lifestyle', name: 'Lifestyle', slug: 'lifestyle', description: 'Digital nomad culture, productivity tips, and personal growth.', status: 'active' },
    { id: 'cat-seo', name: 'SEO & Marketing', slug: 'seo-marketing', description: 'Guides, tips, and strategies for climbing search engine rankings.', status: 'active' },
    { id: 'cat-business', name: 'Business', slug: 'business', description: 'Startup news, finance, management, and entrepreneurial growth.', status: 'active' }
  ];

  const tags: Tag[] = [
    { id: 'tag-ai', name: 'AI', slug: 'ai' },
    { id: 'tag-software', name: 'Software', slug: 'software' },
    { id: 'tag-nomad', name: 'Digital Nomad', slug: 'digital-nomad' },
    { id: 'tag-seo', name: 'SEO', slug: 'seo' },
    { id: 'tag-productivity', name: 'Productivity', slug: 'productivity' },
    { id: 'tag-gear', name: 'Gear', slug: 'gear' }
  ];

  const posts: Post[] = [
    {
      id: 'post-1',
      title: 'The Future of AI Content Generation: Balancing Scale and Authenticity',
      slug: 'future-of-ai-content-generation',
      excerpt: 'Explore how AI models are changing the content creation landscape, and why maintaining a human-in-the-loop approach is critical for long-term SEO and reader trust.',
      content: `## The Explosion of Generative AI

In the past few years, artificial intelligence has fundamentally disrupted how we think about writing, marketing, and content strategy. With models like Gemini 3.5 capable of drafting structured, readable articles in seconds, the temptation to scale content production infinitely is higher than ever.

However, content strategy is undergoing a silent counter-revolution. Search engines and readers alike are becoming increasingly sophisticated at spotting "AI slop"—generic, low-value, repetitive content that serves only to populate keyword pages.

---

## Why "Pure AI" content fails the SEO test

While AI tools are excellent writing assistants, publishing raw AI-generated content without human curation presents significant risks:

1. **Lack of Originality (E-E-A-T):** Search engines prioritize **Experience, Expertise, Authoritativeness, and Trustworthiness**. An AI model synthesizes existing web data; it cannot provide first-hand experience, take unique product photos, or conduct real-world tests.
2. **Fact and Detail Hallucinations:** AI models can confidently invent statistics or technical facts, destroying your blog's editorial credibility.
3. **Flat, Monotonous Voice:** Generative writing often lacks the rhythm, wit, and emotional resonance of a professional human writer.

> **Pro Tip:** Use AI as an accelerator, not an author. Use it to outline ideas, brainstorm hooks, and summarize research—but let a human write the core arguments.

---

## The Hybrid Approach: Human-in-the-Loop Content Production

To scale production while maintaining maximum content standards, consider the following blueprint:

### 1. Advanced Research Grounding
Before drafting, use search-grounded models to gather real-time data, verified statistics, and citation sources. This ensures your article is rooted in accurate, timely information.

### 2. The Narrative Outline
Develop a structured skeleton. Ensure there is a logical flow, strong transition hooks, and bullet points that address specific user questions directly.

### 3. Inserting Real Human Experience
Inject personal anecdotes, case study results, custom images, and hands-on reviews. This makes your content deeply authentic, earning readers' trust and driving engagement.

---

## Conclusion

The future of writing isn't AI replacing human creators. It is the creator who integrates AI into their research and drafting process outperforming the creator who doesn't. Emphasize depth, expertise, and polish to ensure your site remains a high-authority resource.`,
      featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800',
      authorId: 'user-admin',
      categoryId: 'cat-tech',
      tags: ['ai', 'software', 'productivity'],
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      readingTime: 4,
      isFeatured: true,
      isTrending: true,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: 'The Future of AI Content Generation: Scale vs Authenticity',
      seoDescription: 'Discover why human-in-the-loop AI writing is the gold standard for SEO authority, reader retention, and building brand trust in 2026.'
    },
    {
      id: 'post-2',
      title: 'Top 10 Essential Gadgets for Modern Digital Nomads',
      slug: 'top-10-gadgets-digital-nomads',
      excerpt: 'From high-speed portable routers to ergonomic folding stands, here is a curated list of tested gear that will supercharge your remote work setup from anywhere.',
      content: `## Designing the Ultimate Portable Office

For a digital nomad, your workspace isn't a room—it is your backpack. Every single ounce of weight matters, and every piece of gear must earn its spot by delivering absolute reliability, versatility, and performance.

Whether you are working from a bustling cafe in Tokyo, a beachside villa in Bali, or a quiet cabin in the Pacific Northwest, here are the top gadgets that will revolutionize your remote work productivity.

---

## 1. Portable Multi-Screen Monitors
Working on a single 13-inch laptop screen can severely throttle your multitasking speed. USB-C powered portable monitors have become incredibly lightweight and high-resolution, giving you a full multi-screen productivity experience on any standard cafe table.

## 2. Global eSIM & Portable Travel Router
Relying on spotty cafe Wi-Fi is a recipe for missed calls and frustration. A global 5G portable travel router lets you insert a local SIM or purchase eSIM data packages, establishing a secure, high-speed, private hot-spot for all your devices simultaneously.

## 3. Ultra-Slim Mechanical Keyboards & Folding Stands
Prolonged typing on flat laptop keyboards on low tables is an ergonomic nightmare. A portable laptop stand paired with a compact mechanical keyboard restores comfortable typing posture, preserving your spine and joints during long content creation sprints.

---

  ## Product Spotlight: DawnWire Travel Hub Pro
*Highly recommended by our team for robust nomad connectivity.*

[affiliate-card:product-travel-hub]

---

## Packing Tips for the Agile Creator

*   **Double Up on USB-C:** Consolidate your power bricks. Carry a single high-wattage (100W+) GaN charger that can power your laptop, phone, and power bank simultaneously.
*   **Acoustic Isolation:** A pair of premium Active Noise Canceling (ANC) headphones is non-negotiable for working in loud public spaces or busy flights.
*   **Durable Tech Pouches:** Keep your cables sorted. Disorganized cables lead to wear, tear, and lost travel time.

Having the right gear doesn't just make work easier—it gives you the freedom to explore the world without compromising your professional performance.`,
      featuredImage: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=800',
      authorId: 'user-editor',
      categoryId: 'cat-lifestyle',
      tags: ['digital-nomad', 'gear', 'productivity'],
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      readingTime: 5,
      isFeatured: false,
      isTrending: true,
      isEditorsPick: true,
      allowComments: true,
      seoTitle: '10 Essential Digital Nomad Gadgets & Gear List',
      seoDescription: 'The ultimate tested gear guide for remote workers, travelers, and content creators. Supercharge your productivity from cafe or cabin.'
    },
    {
      id: 'post-3',
      title: 'Unlocking Organic Reach: The Complete SEO Checklist for Bloggers',
      slug: 'complete-seo-checklist-bloggers',
      excerpt: 'Master the fundamentals of modern SEO, search intent, schema markup, and site structure to attract consistent, high-value organic traffic to your articles.',
      content: `## The Modern Search Landscape

Many bloggers believe that writing high-quality content is enough to attract a massive audience. While excellent writing is a core requirement, the reality is that search algorithms are the main gateway to sustainable visibility. Without technical and structural optimization, your best articles risk remaining completely undiscovered.

Fortunately, modern Search Engine Optimization (SEO) isn't about gaming the algorithm. It is about organizing your content so that search crawlers can easily understand its structure, depth, and relevance.

---

## The On-Page SEO Checklist

When writing a new post, run through these essential parameters before hitting publish:

### 1. Title and Header Hierarchy
*   **The H1 Title:** Must contain your primary focus keyword and be under 60 characters to avoid desktop truncation.
*   **Subheadings (H2, H3):** Use clean, nested heading structures. Introduce secondary semantic search terms into your subheadings naturally.

### 2. The Power of Meta Descriptions
Your meta description is your billboard in the search results page. Write a highly compelling 140-160 character snippet that summarizes the article and includes a clear, conversion-oriented call-to-action.

### 3. URL Structure and Slugs
Keep your URLs short, readable, and clean. Avoid dates, dynamic query parameters, or long titles in your path.
*   **Bad:** \`/blog/2026/06/29/my-title-with-extra-words-and-and-the\`
*   **Good:** \`/blog/clean-keyword-slug\`

---

## Technical SEO Fundamentals

Beyond individual page optimization, ensure your platform supports these global technical standards:

*   **Dynamic XML Sitemaps:** Automatically registers new posts, categories, and tags with search consoles.
*   **Structured Schema Markup:** Embeds JSON-LD script blocks representing \`BlogPosting\` or \`Article\` specifications. This lets search engines present rich snippet reviews, FAQs, or author blocks.
*   **Responsive Page Load Speed:** Clean minified bundles and lazy-loaded image tags are critical for Core Web Vitals compliance.

---

## Consistently Auditing Your Search Strategy

SEO is a long-term compound investment. Analyze your organic impressions, high-ranking pages, and user search phrases weekly. Refine historical posts with fresh data and updated keywords to preserve your search positioning as competitor landscapes shift.`,
      featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      authorId: 'user-admin',
      categoryId: 'cat-seo',
      tags: ['seo', 'software', 'productivity'],
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      readingTime: 3,
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: 'The Complete On-Page and Technical SEO Checklist for Bloggers',
      seoDescription: 'An actionable roadmap for bloggers to optimize headers, meta titles, schema markups, and site speed to skyrocket organic ranking.'
    }
  ];

  const comments: Comment[] = [
    {
      id: 'comm-1',
      postId: 'post-1',
      name: 'Jessica Miller',
      email: 'jessica@techcorp.com',
      content: 'This hybrid human-in-the-loop strategy is exactly what we have implemented. Our traffic recovered significantly after adding expert review boxes!',
      status: 'approved',
      likesCount: 5,
      likedBy: [],
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm-2',
      postId: 'post-1',
      parentId: 'comm-1',
      name: 'Sarah Jenkins',
      email: 'admin@dawnwire.com',
      userId: 'user-admin',
      content: 'Absolutely! Adding authentic expert perspectives is the single best shield against algorithm updates.',
      status: 'approved',
      likesCount: 2,
      likedBy: [],
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm-3',
      postId: 'post-1',
      name: 'John Doe',
      email: 'john@gmail.com',
      content: 'Can you recommend any tools to check for AI content?',
      status: 'approved',
      likesCount: 0,
      likedBy: [],
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm-4',
      postId: 'post-2',
      name: 'Marcus Brody',
      email: 'marcus@brody.io',
      content: 'I bought that GaN charger last month and it has changed my life. Literally replaced 4 separate heavy power adapters.',
      status: 'approved',
      likesCount: 4,
      likedBy: [],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm-5',
      postId: 'post-1',
      name: 'Spammy Sam',
      email: 'sam@spam.com',
      content: 'MAKE $5000 A DAY FROM YOUR HOME!!! CLICK HERE FOR SECRET MONEY METHOD',
      status: 'spam',
      likesCount: 0,
      createdAt: new Date().toISOString()
    }
  ];

  const affiliateLinks: AffiliateLink[] = [
    {
      id: 'link-1',
      title: 'DawnWire Travel Hub Pro (GaN Charger & Router)',
      destinationUrl: 'https://amazon.com/example-travel-hub',
      affiliateUrl: 'https://amazon.com/example-travel-hub?tag=dawnwire-20',
      shortSlug: 'travel-hub',
      categoryId: 'cat-lifestyle',
      postId: 'post-2',
      buttonText: 'Buy on Amazon',
      disclosureText: 'As an Amazon Associate, we earn a small commission from qualifying purchases at no extra cost to you.',
      noFollow: true,
      sponsored: true,
      openInNewTab: true,
      clickCount: 124,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'link-2',
      title: 'Semrush SEO Tool',
      destinationUrl: 'https://semrush.com',
      affiliateUrl: 'https://semrush.sjv.io/dawnwire',
      shortSlug: 'semrush',
      categoryId: 'cat-seo',
      postId: 'post-3',
      buttonText: 'Start Free Trial',
      disclosureText: 'We partner with Semrush to offer exclusive free trials. We may receive commissions upon successful signup.',
      noFollow: true,
      sponsored: true,
      openInNewTab: true,
      clickCount: 45,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const pages: Page[] = [
    {
      id: 'page-about',
      title: 'About Us',
      slug: 'about',
      content: `## Welcome to DawnWire

DawnWire is a premium technology brand specializing in affiliate marketing, buying guides, SEO, AI, web development, and SaaS solutions. We help businesses grow with expert insights and trusted recommendations.

### Our Mission
We provide technology professionals, entrepreneurs, and digital marketers with authoritative reviews, actionable guides, and cutting-edge strategies to navigate the ever-evolving digital landscape.

---

### What We Cover

*   **Tech Reviews & Buying Guides:** In-depth, unbiased reviews of the latest hardware, software, and SaaS tools.
*   **Affiliate Marketing:** Proven strategies and ethical frameworks for building sustainable affiliate revenue.
*   **SEO & Digital Marketing:** Data-driven techniques to improve visibility, traffic, and conversions.
*   **Web Development & WordPress:** Expert guidance on building high-performance websites and WooCommerce stores.
*   **AI & Automation:** Practical applications of AI for business growth and operational efficiency.

Thank you for trusting DawnWire as your technology partner.`,
      status: 'published',
      createdAt: new Date().toISOString(),
      seoTitle: 'About DawnWire — Premium Technology & Affiliate Marketing',
      seoDescription: 'DawnWire is a premium technology brand specializing in affiliate marketing, buying guides, SEO, AI, web development, and SaaS solutions.'
    },
    {
      id: 'page-privacy',
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: `## Privacy Policy

At DawnWire, your privacy is extremely important to us. This document outlines the types of personal data we collect, how it is secured, and how it is utilized to maintain a robust user experience across our platform.

---

### 1. Information We Collect
*   **Comments Data:** When you leave a comment on a blog article, we record the name, email, IP address, user-agent details, and comment body. This data is utilized solely for comment rendering, reply notifications, and spam filtering.
*   **Newsletter Subscribers:** When you join our newsletter, we store your email address and subscription timestamp. You may opt out at any absolute time using the unsubscribe link.
*   **Contact Forms:** Messages sent through our support form record contact names, emails, and message text to respond to your queries.
*   **Analytics Tracking:** We record anonymous affiliate link clicks to present reporting charts in our administrative dashboard.

---

### 2. Information Security
We implement strict cryptographic hashing, secure token headers, and rate-limiting scripts to prevent unauthorized access, database poisonings, or data leakages.

### 3. Contact Us
For any privacy-related queries, please write to us through our primary Contact page.`,
      status: 'published',
      createdAt: new Date().toISOString(),
      seoTitle: 'DawnWire Privacy Policy - Data Protection & GDPR',
      seoDescription: 'Read the official DawnWire privacy policy, data handling practices, GDPR compliance, and cookie usage information.'
    }
  ];

  const settings: SiteSettings = {
    siteName: 'DawnWire',
    siteTagline: 'Unlocking Tech, Lifestyle, & Business Authority',
    logoUrl: '',
    faviconUrl: '',
    defaultLanguage: 'en',
    postsPerPage: 6,
    enableComments: true,
    allowGuestComments: true,
    requireCommentApproval: false,
    affiliateDisclosureText: 'This article may contain affiliate links. If you buy through these links, we may earn a small commission at no extra cost to you. We only recommend products we have personally tested.',
    primaryColor: '#0f172a', // deep slate
    secondaryColor: '#3b82f6', // bright blue
    headerMenu: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/#/page/about' },
      { label: 'Categories', url: '/#/categories' },
      { label: 'Contact', url: '/#/contact' }
    ],
    footerColumns: [
      {
        title: 'Platform',
        links: [
          { label: 'Home', url: '/' },
          { label: 'About Us', url: '/#/page/about' },
          { label: 'Contact', url: '/#/contact' }
        ]
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', url: '/#/page/privacy-policy' },
          { label: 'Affiliate Disclosure', url: '/#/page/privacy-policy' }
        ]
      }
    ],
    socialLinks: [
      { platform: 'Twitter', url: 'https://twitter.com' },
      { platform: 'GitHub', url: 'https://github.com' },
      { platform: 'LinkedIn', url: 'https://linkedin.com' }
    ]
  };

  const media: MediaItem[] = [
    {
      id: 'media-1',
      fileName: 'ai-future.png',
      url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800',
      mimeType: 'image/png',
      size: 45670,
      createdAt: new Date().toISOString()
    },
    {
      id: 'media-2',
      fileName: 'nomad-setup.png',
      url: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=800',
      mimeType: 'image/png',
      size: 51240,
      createdAt: new Date().toISOString()
    }
  ];

  const messages: ContactMessage[] = [
    {
      id: 'msg-1',
      name: 'Robert Carter',
      email: 'robert@marketing.net',
      subject: 'Advertising Sponsorship Query',
      message: 'Hi team, I represent an ergonomic workspace brand. We are looking to sponsor an upcoming post reviewing digital nomad accessories. Can you send over your monthly analytics report and rates?',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      status: 'unread'
    }
  ];

  const newsletter: NewsletterSubscriber[] = [
    { id: 'sub-1', email: 'subscriber@gmail.com', createdAt: new Date().toISOString() }
  ];

  const logs: ActivityLog[] = [
    { id: 'log-1', action: 'System Setup', details: 'Initialized database schema with expert seed records.', createdAt: new Date().toISOString() }
  ];

  return {
    users,
    passwords,
    posts,
    categories,
    tags,
    comments,
    affiliateLinks,
    pages,
    settings,
    media,
    messages,
    newsletter,
    logs,
    contentUpgrades: [],
    topicClusters: [],
    recentlyViewed: [],
    savedComparisons: [],
    wishlist: [],
  };
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = getInitialDB();
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB file, using fallback in-memory state:", e);
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write DB file:", e);
    }
  }

  // Activity logger
  public log(action: string, details: string, userId?: string, userName?: string) {
    const newLog: ActivityLog = {
      id: generateId(),
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    this.data.logs.unshift(newLog);
    // Keep logs limit to 100
    if (this.data.logs.length > 100) {
      this.data.logs.pop();
    }
    this.save();
  }

  // Users
  public getUsers() { return this.data.users; }
  public getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  public verifyPassword(userId: string, pw: string) { 
    const stored = this.data.passwords[userId];
    if (!stored) return false;
    return verifyPassword(pw, stored);
  }
  
  public createUser(user: Omit<User, 'id' | 'createdAt'>, pw: string): User {
    const id = 'user-' + generateId().slice(0, 8);
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.data.passwords[id] = hashPassword(pw);
    this.log('User Registered', `Registered user: ${newUser.name} (${newUser.email})`);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'email'>>, pw?: string): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates
    };

    if (pw) {
      this.data.passwords[id] = hashPassword(pw);
    }

    this.log('Profile Updated', `Updated user details for: ${this.data.users[idx].name}`);
    this.save();
    return this.data.users[idx];
  }

  // Posts
  public getPosts() { return this.data.posts; }
  public getPostById(id: string) { return this.data.posts.find(p => p.id === id); }
  public getPostBySlug(slug: string) { return this.data.posts.find(p => p.slug === slug); }
  
  public createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'readingTime' | 'authorId'>, authorId: string): Post {
    const id = 'post-' + generateId().slice(0, 8);
    
    // Simple reading time calc (avg 200 words per minute)
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const newPost: Post = {
      ...post,
      id,
      authorId,
      readingTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.posts.unshift(newPost);
    this.log('Post Created', `Created article: "${newPost.title}"`);
    this.save();
    return newPost;
  }

  public updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'authorId'>>): Post | null {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;

    let readingTime = this.data.posts[idx].readingTime;
    if (updates.content) {
      const wordCount = updates.content.split(/\s+/).length;
      readingTime = Math.max(1, Math.round(wordCount / 200));
    }

    this.data.posts[idx] = {
      ...this.data.posts[idx],
      ...updates,
      readingTime,
      updatedAt: new Date().toISOString()
    };

    this.log('Post Updated', `Edited article: "${this.data.posts[idx].title}"`);
    this.save();
    return this.data.posts[idx];
  }

  public deletePost(id: string): boolean {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    
    const title = this.data.posts[idx].title;
    this.data.posts.splice(idx, 1);
    
    // Cascade delete comments
    this.data.comments = this.data.comments.filter(c => c.postId !== id);

    this.log('Post Deleted', `Deleted article: "${title}"`);
    this.save();
    return true;
  }

  // Categories
  public getCategories() { return this.data.categories; }
  public createCategory(cat: Omit<Category, 'id'>): Category {
    const id = 'cat-' + generateId().slice(0, 8);
    const newCat: Category = { ...cat, id };
    this.data.categories.push(newCat);
    this.log('Category Created', `Added category: "${newCat.name}"`);
    this.save();
    return newCat;
  }
  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.log('Category Updated', `Updated category: "${this.data.categories[idx].name}"`);
    this.save();
    return this.data.categories[idx];
  }
  public deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const name = this.data.categories[idx].name;
    this.data.categories.splice(idx, 1);
    // Unlink posts
    this.data.posts.forEach(p => {
      if (p.categoryId === id) {
        p.categoryId = ''; // set empty or uncategorized
      }
    });
    this.log('Category Deleted', `Deleted category: "${name}"`);
    this.save();
    return true;
  }

  // Tags
  public getTags() { return this.data.tags; }
  public createTag(tag: Omit<Tag, 'id'>): Tag {
    const id = 'tag-' + generateId().slice(0, 8);
    const newTag: Tag = { ...tag, id };
    this.data.tags.push(newTag);
    this.save();
    return newTag;
  }
  public deleteTag(id: string): boolean {
    const idx = this.data.tags.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.tags.splice(idx, 1);
    this.save();
    return true;
  }

  // Comments
  public getComments() { return this.data.comments; }
  public createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount' | 'status'>): Comment {
    const id = 'comm-' + generateId().slice(0, 8);
    const newComment: Comment = {
      ...comment,
      id,
      status: 'approved', // Auto-approved by default in local settings, filterable via moderations
      likesCount: 0,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    this.log('Comment Submitted', `Author: "${newComment.name}" on post: "${newComment.postId}"`);
    this.save();
    return newComment;
  }
  
  public updateCommentStatus(id: string, status: 'approved' | 'pending' | 'spam'): boolean {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) return false;
    comment.status = status;
    this.log('Comment Moderated', `Set comment status to "${status}" for ID: ${id}`);
    this.save();
    return true;
  }

  public likeComment(id: string, userIdOrIp: string): boolean {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) return false;
    if (!comment.likedBy) comment.likedBy = [];
    
    if (comment.likedBy.includes(userIdOrIp)) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(item => item !== userIdOrIp);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like
      comment.likedBy.push(userIdOrIp);
      comment.likesCount += 1;
    }
    this.save();
    return true;
  }

  public deleteComment(id: string): boolean {
    const idx = this.data.comments.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.comments.splice(idx, 1);
    // Delete replies as well
    this.data.comments = this.data.comments.filter(c => c.parentId !== id);
    this.save();
    return true;
  }

  // Affiliate
  public getAffiliateLinks() { return this.data.affiliateLinks; }
  public getAffiliateBySlug(slug: string) { return this.data.affiliateLinks.find(al => al.shortSlug === slug); }
  
  public createAffiliateLink(link: Omit<AffiliateLink, 'id' | 'createdAt' | 'clickCount'>): AffiliateLink {
    const id = 'link-' + generateId().slice(0, 8);
    const newLink: AffiliateLink = {
      ...link,
      id,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };
    this.data.affiliateLinks.push(newLink);
    this.log('Affiliate Link Created', `Created link: "${newLink.title}" with slug: /go/${newLink.shortSlug}`);
    this.save();
    return newLink;
  }

  public updateAffiliateLink(id: string, updates: Partial<Omit<AffiliateLink, 'id' | 'createdAt' | 'clickCount'>>): AffiliateLink | null {
    const idx = this.data.affiliateLinks.findIndex(al => al.id === id);
    if (idx === -1) return null;
    this.data.affiliateLinks[idx] = {
      ...this.data.affiliateLinks[idx],
      ...updates
    };
    this.save();
    return this.data.affiliateLinks[idx];
  }

  public deleteAffiliateLink(id: string): boolean {
    const idx = this.data.affiliateLinks.findIndex(al => al.id === id);
    if (idx === -1) return false;
    this.data.affiliateLinks.splice(idx, 1);
    this.save();
    return true;
  }

  public trackAffiliateClick(slug: string): string | null {
    const link = this.data.affiliateLinks.find(al => al.shortSlug === slug);
    if (!link) return null;
    link.clickCount += 1;
    this.log('Affiliate Redirect', `Click registered on "/go/${slug}" redirecting to "${link.affiliateUrl}"`);
    this.save();
    return link.affiliateUrl;
  }

  // Pages
  public getPages() { return this.data.pages; }
  public getPageBySlug(slug: string) { return this.data.pages.find(pg => pg.slug === slug); }
  
  public createPage(page: Omit<Page, 'id'>): Page {
    const id = 'page-' + generateId().slice(0, 8);
    const newPage: Page = { ...page, id };
    this.data.pages.push(newPage);
    this.log('Page Created', `Created static page: "${newPage.title}"`);
    this.save();
    return newPage;
  }

  public updatePage(id: string, updates: Partial<Page>): Page | null {
    const idx = this.data.pages.findIndex(pg => pg.id === id);
    if (idx === -1) return null;
    this.data.pages[idx] = { ...this.data.pages[idx], ...updates };
    this.log('Page Updated', `Edited static page: "${this.data.pages[idx].title}"`);
    this.save();
    return this.data.pages[idx];
  }

  public deletePage(id: string): boolean {
    const idx = this.data.pages.findIndex(pg => pg.id === id);
    if (idx === -1) return false;
    const title = this.data.pages[idx].title;
    this.data.pages.splice(idx, 1);
    this.log('Page Deleted', `Deleted page: "${title}"`);
    this.save();
    return true;
  }

  // Settings
  public getSettings() { return this.data.settings; }
  public updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.log('Settings Changed', 'Updated site configuration parameters.');
    this.save();
    return this.data.settings;
  }

  // Media
  public getMedia() { return this.data.media; }
  
  public uploadMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): MediaItem {
    const id = 'media-' + generateId().slice(0, 8);
    const newItem: MediaItem = {
      ...item,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.media.unshift(newItem);
    this.log('Media Uploaded', `Uploaded asset file: "${newItem.fileName}"`);
    this.save();
    return newItem;
  }

  public deleteMedia(id: string): boolean {
    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx === -1) return false;
    const name = this.data.media[idx].fileName;
    this.data.media.splice(idx, 1);
    this.log('Media Deleted', `Removed asset file: "${name}"`);
    this.save();
    return true;
  }

  // Contact
  public getMessages() { return this.data.messages; }
  
  public submitMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): ContactMessage {
    const id = 'msg-' + generateId().slice(0, 8);
    const newMsg: ContactMessage = {
      ...msg,
      id,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    this.data.messages.unshift(newMsg);
    this.log('Message Received', `Inquiry from: ${newMsg.name} (${newMsg.subject})`);
    this.save();
    return newMsg;
  }

  public markMessageRead(id: string, status: 'read' | 'unread'): boolean {
    const msg = this.data.messages.find(m => m.id === id);
    if (!msg) return false;
    msg.status = status;
    this.save();
    return true;
  }

  // Newsletter
  public getNewsletterSubscribers() { return this.data.newsletter; }
  
  public addNewsletterSubscriber(email: string): NewsletterSubscriber | null {
    const exists = this.data.newsletter.some(n => n.email.toLowerCase() === email.toLowerCase());
    if (exists) return null;

    const id = 'sub-' + generateId().slice(0, 8);
    const newSub: NewsletterSubscriber = {
      id,
      email,
      createdAt: new Date().toISOString()
    };
    this.data.newsletter.push(newSub);
    this.log('Newsletter Opt-In', `New subscriber: ${email}`);
    this.save();
    return newSub;
  }

  public deleteSubscriber(id: string): boolean {
    const idx = this.data.newsletter.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.data.newsletter.splice(idx, 1);
    this.save();
    return true;
  }

  public updateSubscriberDripProgress(id: string, dripStep: number, dripLastSentAt: string): boolean {
    const sub = this.data.newsletter.find(n => n.id === id);
    if (!sub) return false;
    sub.dripStep = dripStep;
    sub.dripLastSentAt = dripLastSentAt;
    this.save();
    return true;
  }

  public getSubscribersDueForDrip(): NewsletterSubscriber[] {
    return this.data.newsletter.filter(s => {
      const step = s.dripStep || 0;
      if (step >= 5) return false;
      const nextStep = step + 1;
      const delays: Record<number, number> = { 1: 0, 2: 2, 3: 5, 4: 10, 5: 21 };
      const delayDays = delays[nextStep] || 0;
      if (delayDays === 0) return s.dripStep === undefined || s.dripStep === 0;
      if (!s.dripLastSentAt) return false;
      const lastSent = new Date(s.dripLastSentAt).getTime();
      return (Date.now() - lastSent) >= (delayDays * 24 * 60 * 60 * 1000);
    });
  }

  // Content Upgrades
  public getContentUpgrades() { return this.data.contentUpgrades || []; }

  public createContentUpgrade(data: any): ContentUpgrade {
    const item: ContentUpgrade = {
      id: 'cu-' + generateId().slice(0, 8),
      title: data.title || '',
      description: data.description || '',
      fileUrl: data.fileUrl || '',
      fileType: data.fileType || '',
      postId: data.postId || '',
      postSlug: data.postSlug || '',
      downloadCount: 0,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };
    this.data.contentUpgrades.push(item);
    this.log('Content Upgrade Created', `Created upgrade: "${item.title}"`);
    this.save();
    return item;
  }

  public updateContentUpgrade(id: string, updates: any): ContentUpgrade | null {
    const idx = this.data.contentUpgrades.findIndex((u: any) => u.id === id);
    if (idx === -1) return null;
    this.data.contentUpgrades[idx] = { ...this.data.contentUpgrades[idx], ...updates, updatedAt: new Date().toISOString() };
    this.log('Content Upgrade Updated', `Updated upgrade: "${this.data.contentUpgrades[idx].title}"`);
    this.save();
    return this.data.contentUpgrades[idx];
  }

  public deleteContentUpgrade(id: string): boolean {
    const idx = this.data.contentUpgrades.findIndex((u: any) => u.id === id);
    if (idx === -1) return false;
    const title = this.data.contentUpgrades[idx].title;
    this.data.contentUpgrades.splice(idx, 1);
    this.log('Content Upgrade Deleted', `Deleted upgrade: "${title}"`);
    this.save();
    return true;
  }

  public trackUpgradeDownload(id: string): boolean {
    const idx = this.data.contentUpgrades.findIndex((u: any) => u.id === id);
    if (idx === -1) return false;
    this.data.contentUpgrades[idx].downloadCount += 1;
    this.log('Content Upgrade Download', `Downloaded: "${this.data.contentUpgrades[idx].title}"`);
    this.save();
    return true;
  }

  // Logs
  public getLogs() { return this.data.logs; }

  // Topic Clusters
  public getTopicClusters(): TopicCluster[] { return this.data.topicClusters; }

  public createTopicCluster(data: Omit<TopicCluster, 'id' | 'createdAt' | 'updatedAt'>): TopicCluster {
    const id = 'clstr-' + generateId().slice(0, 8);
    const cluster: TopicCluster = { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.data.topicClusters.push(cluster);
    this.log('Topic Cluster Created', `Created cluster: "${cluster.name}"`);
    this.save();
    return cluster;
  }

  public updateTopicCluster(id: string, updates: Partial<TopicCluster>): TopicCluster | null {
    const idx = this.data.topicClusters.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.topicClusters[idx] = { ...this.data.topicClusters[idx], ...updates, updatedAt: new Date().toISOString() };
    this.log('Topic Cluster Updated', `Updated cluster: "${this.data.topicClusters[idx].name}"`);
    this.save();
    return this.data.topicClusters[idx];
  }

  public deleteTopicCluster(id: string): boolean {
    const idx = this.data.topicClusters.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const name = this.data.topicClusters[idx].name;
    this.data.topicClusters.splice(idx, 1);
    this.log('Topic Cluster Deleted', `Deleted cluster: "${name}"`);
    this.save();
    return true;
  }

  // ====== Affiliate Platform Stubs ======
  async getBrands(): Promise<any[]> { return []; }
  async getBrand(id: string): Promise<any> { return null; }
  async createBrand(input: any): Promise<any> { return input; }
  async updateBrand(id: string, updates: any): Promise<any> { return null; }
  async deleteBrand(id: string): Promise<boolean> { return false; }
  async getCategoryBanners(categoryId?: string): Promise<any[]> { return []; }
  async createCategoryBanner(input: any): Promise<any> { return input; }
  async updateCategoryBanner(id: string, updates: any): Promise<any> { return null; }
  async deleteCategoryBanner(id: string): Promise<boolean> { return false; }
  async getCategorySections(categoryId?: string): Promise<any[]> { return []; }
  async createCategorySection(input: any): Promise<any> { return input; }
  async updateCategorySection(id: string, updates: any): Promise<any> { return null; }
  async deleteCategorySection(id: string): Promise<boolean> { return false; }
  async getDeals(categoryId?: string, status?: string): Promise<any[]> { return []; }
  async createDeal(input: any): Promise<any> { return input; }
  async updateDeal(id: string, updates: any): Promise<any> { return null; }
  async deleteDeal(id: string): Promise<boolean> { return false; }
  async getHomepageSections(): Promise<any[]> { return []; }
  async createHomepageSection(input: any): Promise<any> { return input; }
  async updateHomepageSection(id: string, updates: any): Promise<any> { return null; }
  async deleteHomepageSection(id: string): Promise<boolean> { return false; }
  async getHomepageHeroSlides(): Promise<any[]> { return []; }
  async createHomepageHeroSlide(input: any): Promise<any> { return input; }
  async updateHomepageHeroSlide(id: string, updates: any): Promise<any> { return null; }
  async deleteHomepageHeroSlide(id: string): Promise<boolean> { return false; }
  async addWishlistItem(input: any): Promise<any> {
    const item = { ...input, id: generateId(), createdAt: new Date().toISOString() };
    this.data.wishlist = this.data.wishlist || [];
    this.data.wishlist.push(item);
    this.save();
    return item;
  }
  async removeWishlistItem(id: string): Promise<boolean> {
    if (!this.data.wishlist) return false;
    const initialLen = this.data.wishlist.length;
    this.data.wishlist = this.data.wishlist.filter((w: any) => w.id !== id && w.productId !== id);
    if (this.data.wishlist.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
  async getWishlist(userId?: string, sessionId?: string): Promise<any[]> {
    if (!this.data.wishlist) return [];
    return this.data.wishlist.filter((w: any) => 
      (userId && w.userId === userId) || (sessionId && w.sessionId === sessionId)
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addRecentlyViewed(input: any): Promise<void> {
    this.data.recentlyViewed = this.data.recentlyViewed || [];
    // Remove if already exists so we can push to top
    this.data.recentlyViewed = this.data.recentlyViewed.filter((r: any) => 
      !(r.productId === input.productId && (r.userId === input.userId || r.sessionId === input.sessionId))
    );
    const item = { ...input, id: generateId(), viewedAt: new Date().toISOString() };
    this.data.recentlyViewed.unshift(item);
    
    // Prune to 50 items max
    if (this.data.recentlyViewed.length > 50) {
      this.data.recentlyViewed = this.data.recentlyViewed.slice(0, 50);
    }
    this.save();
  }
  async getRecentlyViewed(userId?: string, sessionId?: string, limit: number = 20): Promise<any[]> {
    if (!this.data.recentlyViewed) return [];
    return this.data.recentlyViewed.filter((r: any) => 
      (userId && r.userId === userId) || (sessionId && r.sessionId === sessionId)
    ).slice(0, limit);
  }

  async getSavedComparisons(userId?: string, sessionId?: string): Promise<any[]> {
    if (!this.data.savedComparisons) return [];
    return this.data.savedComparisons.filter((c: any) => 
      (userId && c.userId === userId) || (sessionId && c.sessionId === sessionId)
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async saveComparison(input: any): Promise<any> {
    const item = { ...input, id: generateId(), createdAt: new Date().toISOString() };
    this.data.savedComparisons = this.data.savedComparisons || [];
    this.data.savedComparisons.unshift(item);
    this.save();
    return item;
  }
  async deleteSavedComparison(id: string): Promise<boolean> {
    if (!this.data.savedComparisons) return false;
    const initialLen = this.data.savedComparisons.length;
    this.data.savedComparisons = this.data.savedComparisons.filter((c: any) => c.id !== id);
    if (this.data.savedComparisons.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
  async logAffiliateClick(input: any): Promise<void> {}
  async logSearch(input: any): Promise<void> {}
  async getSearchAnalytics(days?: number): Promise<any> { return {}; }
  async getPriceAlerts(userId?: string, sessionId?: string): Promise<any[]> { return []; }
  async createPriceAlert(input: any): Promise<any> { return input; }
  async deletePriceAlert(id: string): Promise<boolean> { return false; }
  async getClickAnalytics(days?: number, groupBy?: string): Promise<any[]> { return []; }
  // ====== Amazon Sync stubs ======
  async getAmazonSyncStatus(productId: string): Promise<any> { return null; }
  async listAmazonSyncStatus(limit = 500, offset = 0, filter?: any): Promise<any> { return { data: [], total: 0 }; }
  async updateAmazonSyncStatus(productId: string, updates: any): Promise<boolean> { return false; }
  async bulkCreateAmazonSyncStatus(entries: any[]): Promise<number> { return 0; }
  async getAmazonPriceHistory(productId: string, limit = 20): Promise<any[]> { return []; }
  async getAmazonSyncLogs(productId?: string, batchId?: string, limit = 50): Promise<any[]> { return []; }
  async getAmazonMarketplaces(): Promise<any[]> { return []; }
  async getAmazonApiCredentials(marketplaceCode?: string): Promise<any[]> { return []; }
  async upsertAmazonApiCredential(input: any): Promise<boolean> { return false; }
  async getAmazonSyncSettings(): Promise<any> { return null; }
  async updateAmazonSyncSettings(updates: any): Promise<boolean> { return false; }
  async getAmazonApiUsage(days = 7): Promise<any[]> { return []; }
}

export const dbInstance = new Database();

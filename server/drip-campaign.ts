import { Resend } from 'resend';
import { NewsletterSubscriber, DripCampaignEmail } from '../src/types';

const resendApiKey = process.env.RESEND_API_KEY || '';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@auracms.blog';
const siteUrl = process.env.SITE_URL || 'https://auracms.blog';
const siteName = 'DawnWire';

const DRIP_EMAILS: DripCampaignEmail[] = [
  { step: 1, subject: `Welcome to ${siteName} — Your Tech Insights Start Here`, delayDays: 0 },
  { step: 2, subject: `${siteName} Picks: 5 Must-Read Articles This Week`, delayDays: 2 },
  { step: 3, subject: `Recommended Tools & Resources from ${siteName}`, delayDays: 5 },
  { step: 4, subject: `Member Exclusive: Deals on Top-Rated Products`, delayDays: 10 },
  { step: 5, subject: `We Miss You — Latest from ${siteName}`, delayDays: 21 },
];

const MAX_DRIP_STEP = DRIP_EMAILS.length;

function getDripEmail(step: number): DripCampaignEmail | undefined {
  return DRIP_EMAILS.find(e => e.step === step);
}

export function getDripCampaignConfig(): DripCampaignEmail[] {
  return [...DRIP_EMAILS];
}

function wrapEmailTemplate(subject: string, bodyHtml: string): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #246BFF; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">DW</div>
      </div>
      ${bodyHtml}
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e3a5f; text-align: center;">
        <p style="font-size: 11px; color: #64748b; margin: 0 0 8px;">
          You received this because you subscribed to ${siteName}.
        </p>
        <p style="font-size: 11px; color: #64748b; margin: 0;">
          <a href="${siteUrl}/unsubscribe" style="color: #246BFF; text-decoration: underline;">Unsubscribe</a> &middot;
          <a href="${siteUrl}" style="color: #246BFF; text-decoration: underline;">${siteName}</a>
        </p>
      </div>
    </div>
  `;
}

function renderStep1(): string {
  return `
    <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">Welcome to ${siteName}!</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
      You've joined a community of tech enthusiasts and professionals. We'll send you our best guides, 
      product reviews, and industry insights to help you make smarter decisions.
    </p>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
      <h2 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">What to Expect</h2>
      <table style="font-size: 13px; color: #94a3b8; width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; width: 24px; vertical-align: top;">📬</td><td style="padding: 6px 0;"><strong style="color: #f8fafc;">Curated content</strong> — Top articles hand-picked for you</td></tr>
        <tr><td style="padding: 6px 0; width: 24px; vertical-align: top;">🏷️</td><td style="padding: 6px 0;"><strong style="color: #f8fafc;">Exclusive deals</strong> — Member-only discounts on tools</td></tr>
        <tr><td style="padding: 6px 0; width: 24px; vertical-align: top;">🔍</td><td style="padding: 6px 0;"><strong style="color: #f8fafc;">In-depth reviews</strong> — Honest analysis before you buy</td></tr>
      </table>
    </div>
    <a href="${siteUrl}" style="display: inline-block; background: #246BFF; color: white; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 14px; text-decoration: none;">Browse Latest Articles</a>
  `;
}

function renderStep2(): string {
  return `
    <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">Our Top Picks This Week</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
      Here are the articles our readers found most valuable this week.
    </p>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">📖 How to Choose the Right Analytics Platform</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">A practical guide comparing GA4, Plausible, and Fathom.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Read More &rarr;</a>
    </div>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">🔧 Top 10 Productivity Tools for Remote Teams</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">Streamline your workflow with these essential tools.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Read More &rarr;</a>
    </div>
    <div style="background: #08152E; border-radius: 14px; padding: 20px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">📊 2026 Affiliate Marketing Trends</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">What's working now and what's next.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Read More &rarr;</a>
    </div>
  `;
}

function renderStep3(): string {
  return `
    <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">Tools We Recommend</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
      After testing dozens of products, here are the tools that consistently deliver.
    </p>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 40px; vertical-align: top; font-size: 24px;">🛒</td>
          <td style="padding-left: 12px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">Best Email Marketing Platform</h3>
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Our top pick for automation and deliverability.</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 40px; vertical-align: top; font-size: 24px;">⚡</td>
          <td style="padding-left: 12px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">Analytics Suite for Beginners</h3>
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Simple yet powerful insights for your business.</p>
          </td>
        </tr>
      </table>
    </div>
    <a href="${siteUrl}/reviews" style="display: inline-block; background: #246BFF; color: white; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 14px; text-decoration: none;">See All Reviews</a>
  `;
}

function renderStep4(): string {
  return `
    <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">Exclusive Member Deals 🏷️</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
      As a ${siteName} subscriber, you get early access to these limited-time offers.
    </p>
    <div style="background: linear-gradient(135deg, #1a3a6b, #0A1F44); border-radius: 14px; padding: 20px; margin-bottom: 16px; border: 1px solid #246BFF40;">
      <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">🔥 Premium Analytics Tool — 30% Off</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">Exclusive discount for our readers. Limited spots available.</p>
      <span style="display: inline-block; background: #246BFF; color: white; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">SAVE 30%</span>
    </div>
    <div style="background: #08152E; border-radius: 14px; padding: 20px;">
      <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">📧 Email Course: Affiliate Marketing 101</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">Free 5-day course. Learn how to monetize your content.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Enroll Free &rarr;</a>
    </div>
  `;
}

function renderStep5(): string {
  return `
    <h1 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">We've Missed You! 👋</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
      It's been a while since your last visit. Here's what you may have missed on ${siteName}.
    </p>
    <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">🏆 Best Laptops for Developers (2026)</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">We tested 20+ laptops — here are the top 5.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Read Review &rarr;</a>
    </div>
    <div style="background: #08152E; border-radius: 14px; padding: 20px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin: 0 0 4px;">📈 SEO Checklist for 2026</h3>
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px;">Everything you need to rank higher this year.</p>
      <a href="${siteUrl}" style="font-size: 12px; color: #246BFF; text-decoration: none; font-weight: 600;">Get the Checklist &rarr;</a>
    </div>
  `;
}

function renderDripBody(step: number): string | null {
  switch (step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    case 5: return renderStep5();
    default: return null;
  }
}

export async function sendDripEmail(subscriber: NewsletterSubscriber, step: number): Promise<boolean> {
  const config = getDripEmail(step);
  if (!config) return false;

  const bodyHtml = renderDripBody(step);
  if (!bodyHtml) return false;

  if (!resendApiKey) return false;

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: subscriber.email,
      subject: config.subject,
      html: wrapEmailTemplate(config.subject, bodyHtml),
    });
    return true;
  } catch (e) {
    console.error(`[Drip] Failed to send step ${step} to ${subscriber.email}:`, e);
    return false;
  }
}

export function getNextDripStep(subscriber: NewsletterSubscriber): number | null {
  const currentStep = subscriber.dripStep || 0;
  if (currentStep >= MAX_DRIP_STEP) return null;

  const nextStep = currentStep + 1;
  const nextEmail = getDripEmail(nextStep);
  if (!nextEmail) return null;

  if (nextEmail.delayDays === 0) return nextStep;

  if (!subscriber.dripLastSentAt) return nextStep;

  const lastSent = new Date(subscriber.dripLastSentAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - lastSent) / (1000 * 60 * 60);
  const requiredHours = nextEmail.delayDays * 24;

  if (hoursElapsed >= requiredHours) return nextStep;

  return null;
}

export { DRIP_EMAILS, MAX_DRIP_STEP };

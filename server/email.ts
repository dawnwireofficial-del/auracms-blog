import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@auracms.blog';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@auracms.blog';
let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    client = new Resend(resendApiKey);
  }
  return client;
}

export function isEmailConfigured(): boolean {
  return !!resendApiKey;
}

// 1. Welcome Email — triggered on new registration
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await getClient().emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to DawnWire — Your Account Is Ready',
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #246BFF; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">DW</div>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">Welcome, ${name}!</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px;">
            Your DawnWire profile is active. Browse articles, join discussions, and stay ahead with premium technology insights.
          </p>
          <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Quick Start</h2>
            <ul style="font-size: 13px; color: #94a3b8; line-height: 1.8; padding-left: 16px; margin: 0;">
              <li>Browse the latest technology guides</li>
              <li>Join discussions with industry experts</li>
              <li>Subscribe to the weekly newsletter</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
            DawnWire &mdash; Technology that helps businesses grow.
          </p>
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error('Failed to send welcome email:', e);
    return false;
  }
}

// 2. Contact Notification — notifies admin of new inquiry
export async function sendContactNotification(name: string, email: string, subject: string, message: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await getClient().emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `[DawnWire Contact] ${subject}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="display: inline-block; background: #246BFF; width: 40px; height: 40px; border-radius: 14px; line-height: 40px; font-size: 18px; font-weight: 900; color: white;">DW</div>
          </div>
          <h1 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 16px;">New Contact Inquiry</h1>
          <table style="font-size: 13px; color: #94a3b8; width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: 600; color: #f8fafc;">Name</td><td style="padding: 6px 0;">${name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #f8fafc;">Email</td><td style="padding: 6px 0;">${email}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #f8fafc;">Subject</td><td style="padding: 6px 0;">${subject}</td></tr>
          </table>
          <div style="background: #08152E; border-radius: 14px; padding: 16px; margin-top: 16px;">
            <p style="font-size: 13px; color: #e2e8f0; margin: 0; line-height: 1.6;">${message}</p>
          </div>
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error('Failed to send contact notification:', e);
    return false;
  }
}

// 3. Comment Notification — notifies post author when a comment is posted
export async function sendCommentNotification(postTitle: string, commenterName: string, commentContent: string, authorEmail: string, postUrl?: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await getClient().emails.send({
      from: fromEmail,
      to: authorEmail,
      subject: `New comment on "${postTitle}" by ${commenterName}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="display: inline-block; background: #246BFF; width: 40px; height: 40px; border-radius: 14px; line-height: 40px; font-size: 18px; font-weight: 900; color: white;">DW</div>
          </div>
          <h1 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">New Comment</h1>
          <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px;">
            <strong style="color: #f8fafc;">${commenterName}</strong> commented on <strong style="color: #f8fafc;">${postTitle}</strong>
          </p>
          <div style="background: #08152E; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
            <p style="font-size: 13px; color: #e2e8f0; margin: 0; line-height: 1.6; font-style: italic;">"${commentContent}"</p>
          </div>
          ${postUrl ? `<a href="${postUrl}" style="display: inline-block; background: #246BFF; color: white; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 14px; text-decoration: none;">View Comment</a>` : ''}
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error('Failed to send comment notification:', e);
    return false;
  }
}

// 4. Newsletter Broadcast — sends to a list of subscribers
export async function sendNewsletterBroadcast(subscribers: { email: string }[], subject: string, htmlContent: string): Promise<{ sent: number; failed: number }> {
  if (!isEmailConfigured()) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await getClient().emails.send({
        from: fromEmail,
        to: sub.email,
        subject,
        html: htmlContent
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send newsletter to ${sub.email}:`, e);
      failed++;
    }
  }

  return { sent, failed };
}

// 5. Price Drop Alert
export async function sendPriceDropAlertEmail(email: string, productName: string, productUrl: string, oldPrice: number, newPrice: number): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await getClient().emails.send({
      from: fromEmail,
      to: email,
      subject: `Price Drop Alert: ${productName} is now $${newPrice}!`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #10b981; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">$</div>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">Great news! The price dropped.</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px;">
            The item you've been watching, <strong>${productName}</strong>, has just dropped in price from $${oldPrice} to <strong>$${newPrice}</strong>.
          </p>
          <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <a href="${productUrl}" style="display: inline-block; background: #246BFF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">View Deal Now</a>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
            DawnWire — Never miss a great deal again.
          </p>
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error('Failed to send price drop alert email:', e);
    return false;
  }
}

// 5b. Price Increase Alert — emailed when a watched product rises to/above the target
export async function sendPriceIncreaseAlertEmail(email: string, productName: string, productUrl: string, oldPrice: number, newPrice: number): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await getClient().emails.send({
      from: fromEmail,
      to: email,
      subject: `Price Increase Alert: ${productName} is now $${newPrice}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #f59e0b; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">$</div>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">Price update: ${productName}</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px;">
            The item you've been watching, <strong>${productName}</strong>, is now <strong>$${newPrice}</strong> (was $${oldPrice}). We'll keep watching it and let you know about any future price drops.
          </p>
          <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <a href="${productUrl}" style="display: inline-block; background: #246BFF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">View Product</a>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
            DawnWire — Never miss a great deal again.
          </p>
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error('Failed to send price increase alert email:', e);
    return false;
  }
}

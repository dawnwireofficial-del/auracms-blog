import { createClient } from '@supabase/supabase-js';
import { sendNewsletterBroadcast } from './email';
import { getTrafficData, getClickData, getEngagementData } from './analytics';

function getClient() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}

const MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];

interface AlertConfig {
  dailyDigest: boolean;
  weeklyDigest: boolean;
  trafficSpikeThreshold: number;
  milestones: boolean;
  adminEmail: string;
}

export async function getAlertConfig(): Promise<AlertConfig> {
  try {
    const sb = await getClient();
    const { data } = await sb.from('site_settings').select('value').eq('key', 'alert_config').single();
    if (data?.value) return { dailyDigest: false, weeklyDigest: true, trafficSpikeThreshold: 200, milestones: true, adminEmail: process.env.ADMIN_EMAIL || 'admin@auracms.blog', ...(typeof data.value === 'string' ? JSON.parse(data.value) : data.value) };
  } catch (e) { console.error(e) }
  return { dailyDigest: false, weeklyDigest: true, trafficSpikeThreshold: 200, milestones: true, adminEmail: process.env.ADMIN_EMAIL || 'admin@auracms.blog' };
}

export async function saveAlertConfig(config: AlertConfig): Promise<boolean> {
  try {
    const sb = await getClient();
    await sb.from('site_settings').upsert({ key: 'alert_config', value: config }, { onConflict: 'key' });
    return true;
  } catch { return false; }
}

async function getLastNotification(type: string): Promise<string | null> {
  try {
    const sb = await getClient();
    const { data } = await sb.from('alert_log').select('sent_at').eq('type', type).order('sent_at', { ascending: false }).limit(1).single();
    return data?.sent_at || null;
  } catch { return null; }
}

async function logNotification(type: string, message: string): Promise<void> {
  try {
    const sb = await getClient();
    await sb.from('alert_log').insert({ type, message, sent_at: new Date().toISOString() });
  } catch (e) { console.error(e) }
}

export async function getMilestoneProgress(): Promise<{ current: number; nextMilestone: number; label: string }[]> {
  const [traffic, clicks, engagement] = await Promise.all([getTrafficData(30), getClickData(30), getEngagementData(30)]);
  const totals = {
    'Page Views': traffic.dailyViews.reduce((s, d) => s + d.views, 0),
    'Affiliate Clicks': clicks.dailyClicks.reduce((s, d) => s + d.clicks, 0),
    'Comments': engagement?.totalComments || 0,
    'Subscribers': engagement?.totalSubscribers || 0,
  };
  return Object.entries(totals).map(([label, current]) => {
    const next = MILESTONES.find(m => m > current) || current;
    return { current, nextMilestone: next, label };
  });
}

export async function checkMilestones(): Promise<string[]> {
  const config = await getAlertConfig();
  if (!config.milestones) return [];
  const progress = await getMilestoneProgress();
  const alerts: string[] = [];
  for (const { label, current, nextMilestone } of progress) {
    const lastNotif = await getLastNotification(`milestone_${label}_${nextMilestone}`);
    if (current >= nextMilestone && !lastNotif) {
      alerts.push(`🎉 Milestone reached: ${label} hit ${current.toLocaleString()}!`);
      await logNotification(`milestone_${label}_${nextMilestone}`, `Reached ${current} ${label}`);
    }
  }
  return alerts;
}

export async function checkTrafficSpike(): Promise<string[]> {
  const config = await getAlertConfig();
  const traffic = await getTrafficData(2);
  const daily = traffic.dailyViews;
  if (daily.length < 2) return [];
  const today = daily[daily.length - 1]?.views || 0;
  const yesterday = daily[daily.length - 2]?.views || 1;
  const pctIncrease = ((today - yesterday) / yesterday) * 100;
  if (pctIncrease >= config.trafficSpikeThreshold) {
    const lastNotif = await getLastNotification('traffic_spike');
    const cooldown = lastNotif ? (Date.now() - new Date(lastNotif).getTime()) < 86400000 : false;
    if (!cooldown) {
      const msg = `📈 Traffic spike detected: ${pctIncrease.toFixed(0)}% increase (${today} views today vs ${yesterday} yesterday)`;
      await logNotification('traffic_spike', msg);
      return [msg];
    }
  }
  return [];
}

export async function sendDailyDigest(): Promise<string | null> {
  const config = await getAlertConfig();
  if (!config.dailyDigest) return null;
  const lastNotif = await getLastNotification('daily_digest');
  const cooldown = lastNotif ? (Date.now() - new Date(lastNotif).getTime()) < 7200000 : false;
  if (cooldown) return null;

  const [traffic, clicks, engagement] = await Promise.all([getTrafficData(1), getClickData(1), getEngagementData(1)]);
  const totalViews = traffic.dailyViews.reduce((s, d) => s + d.views, 0);
  const totalClicks = clicks.dailyClicks.reduce((s, d) => s + d.clicks, 0);

  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #246BFF; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">DW</div>
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">📊 Daily Analytics Digest</h1>
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 20px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
        <h2 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">Today's Stats</h2>
        <table style="font-size: 13px; color: #94a3b8; width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">Page Views</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${totalViews.toLocaleString()}</td></tr>
          <tr><td style="padding: 4px 0;">Affiliate Clicks</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${totalClicks.toLocaleString()}</td></tr>
          <tr><td style="padding: 4px 0;">Comments</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${engagement?.totalComments || 0}</td></tr>
          <tr><td style="padding: 4px 0;">Subscribers</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${engagement?.totalSubscribers || 0}</td></tr>
        </table>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">DawnWire Analytics Digest</p>
    </div>`;

  await sendNewsletterBroadcast([{ email: config.adminEmail }], `📊 Daily Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, html);
  await logNotification('daily_digest', `Daily digest sent — ${totalViews} views, ${totalClicks} clicks`);
  return `Daily digest sent — ${totalViews} views, ${totalClicks} clicks`;
}

export async function sendWeeklyDigest(): Promise<string | null> {
  const config = await getAlertConfig();
  if (!config.weeklyDigest) return null;
  const lastNotif = await getLastNotification('weekly_digest');
  const cooldown = lastNotif ? (Date.now() - new Date(lastNotif).getTime()) < 604800000 : false;
  if (cooldown) return null;

  const [traffic, clicks, engagement] = await Promise.all([getTrafficData(7), getClickData(7), getEngagementData(7)]);
  const totalViews = traffic.dailyViews.reduce((s, d) => s + d.views, 0);
  const totalClicks = clicks.dailyClicks.reduce((s, d) => s + d.clicks, 0);
  const progress = await getMilestoneProgress();

  let milestonesHtml = '';
  for (const { label, current, nextMilestone } of progress) {
    milestonesHtml += `<tr><td style="padding: 4px 0;">${label}</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${current.toLocaleString()}</td><td style="padding: 4px 0; text-align: right; color: #94a3b8;">next: ${nextMilestone.toLocaleString()}</td></tr>`;
  }

  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A1F44; border-radius: 24px; color: #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #246BFF; width: 48px; height: 48px; border-radius: 14px; line-height: 48px; font-size: 22px; font-weight: 900; color: white;">DW</div>
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 8px;">📈 Weekly Analytics Digest</h1>
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 20px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
        <h2 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">7-Day Summary</h2>
        <table style="font-size: 13px; color: #94a3b8; width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">Page Views</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${totalViews.toLocaleString()}</td></tr>
          <tr><td style="padding: 4px 0;">Affiliate Clicks</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${totalClicks.toLocaleString()}</td></tr>
          <tr><td style="padding: 4px 0;">Comments</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${engagement?.totalComments || 0}</td></tr>
          <tr><td style="padding: 4px 0;">Subscribers</td><td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: 600;">${engagement?.totalSubscribers || 0}</td></tr>
        </table>
      </div>
      <div style="background: #08152E; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
        <h2 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">Milestone Progress</h2>
        <table style="font-size: 13px; color: #94a3b8; width: 100%; border-collapse: collapse;">${milestonesHtml}</table>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">DawnWire Weekly Analytics Digest</p>
    </div>`;

  await sendNewsletterBroadcast([{ email: config.adminEmail }], `📈 Weekly Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, html);
  await logNotification('weekly_digest', `Weekly digest sent — ${totalViews} views, ${totalClicks} clicks`);
  return `Weekly digest sent — ${totalViews} views, ${totalClicks} clicks`;
}

export async function runAllAlerts(): Promise<{ milestones: string[]; trafficSpikes: string[]; digest: string | null }> {
  const [milestones, trafficSpikes] = await Promise.all([checkMilestones(), checkTrafficSpike()]);
  const digest = await sendDailyDigest();
  return { milestones, trafficSpikes, digest };
}

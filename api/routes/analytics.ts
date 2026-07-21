import express from 'express';
import { authenticate, requireRole } from './middleware';

const router = express.Router();

router.get('/traffic', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getTrafficData } = await import('../../server/analytics');
  res.json(await getTrafficData(days));
});

router.get('/clicks', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getClickData } = await import('../../server/analytics');
  res.json(await getClickData(days));
});

router.get('/engagement', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getEngagementData } = await import('../../server/analytics');
  res.json(await getEngagementData(days));
});

router.get('/content-performance', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getContentPerformance } = await import('../../server/analytics');
  res.json(await getContentPerformance(days));
});

router.get('/recent-activity', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const { getRecentActivity } = await import('../../server/analytics');
  res.json(await getRecentActivity(days));
});

router.get('/newsletter', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getNewsletterAnalytics } = await import('../../server/analytics');
  res.json(await getNewsletterAnalytics(days));
});

router.get('/products', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const { getProductAnalytics } = await import('../../server/analytics');
  res.json(await getProductAnalytics(days));
});

// ====== Analytics Alerts ======
router.get('/alerts/config', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  const { getAlertConfig } = await import('../../server/analytics-alerts');
  res.json(await getAlertConfig());
});

router.post('/alerts/config', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  const { saveAlertConfig } = await import('../../server/analytics-alerts');
  const ok = await saveAlertConfig(req.body);
  res.json({ success: ok });
});

router.post('/alerts/run', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  const { runAllAlerts } = await import('../../server/analytics-alerts');
  res.json(await runAllAlerts());
});

router.get('/alerts/milestones', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  const { getMilestoneProgress } = await import('../../server/analytics-alerts');
  res.json(await getMilestoneProgress());
});

export default router;

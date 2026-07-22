import express from 'express';
import { Pool } from 'pg';
import { dbInstance, useSupabase } from '../../server/db';
import { getSupabase, getSupabaseAdmin } from '../../server/lib/supabase';
import { sendWelcomeEmail } from '../../server/email';
import { authenticate } from './middleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many registration attempts. Try again later.' }
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}

router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be 2-100 characters' });
  const safeName = sanitize(name);
  const safeEmail = email.trim().toLowerCase();
  const existing = await dbInstance.getUserByEmail(safeEmail);
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const nu = await dbInstance.createUser({ name: safeName, email: safeEmail, role: 'subscriber', status: 'active' }, password);
  sendWelcomeEmail(safeEmail, safeName);
  if (useSupabase) {
    try {
      const { data } = await getSupabase().auth.signInWithPassword({ email: safeEmail, password });
      if (data?.session?.access_token) return res.json({ token: data.session.access_token, user: nu });
    } catch (e) { console.error(e) }
  }
  res.json({ token: `token-${nu.id}`, user: nu });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
  const safeEmail = email.trim().toLowerCase();
  if (useSupabase) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({ email: safeEmail, password });
      if (!error && data.session) {
        let user = await dbInstance.getUserByEmail(safeEmail);
        if (!user) {
          const role = 'subscriber';
          const name = data.user.user_metadata?.name || safeEmail.split('@')[0];
          const profile = { id: data.user.id, name, email: safeEmail, role, status: 'active', created_at: new Date().toISOString() };
          let created = false;
          if (process.env.SUPABASE_DB_URL) {
            const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
            try {
              const ins = await pool.query('INSERT INTO public.users (id, name, email, role, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [profile.id, profile.name, profile.email, profile.role, profile.status, profile.created_at]);
              if (ins.rows[0]) { user = { id: ins.rows[0].id, name: ins.rows[0].name, email: ins.rows[0].email, role: ins.rows[0].role, avatar: '', bio: '', status: 'active', createdAt: ins.rows[0].created_at }; created = true; }
            } finally { pool.end().catch(() => {}) }
          }
          if (!created) {
            try {
              const adminSb = await getSupabaseAdmin();
              const { data: inserted } = await adminSb.from('users').insert(profile).select().single();
              if (inserted) { user = { id: inserted.id, name: inserted.name, email: inserted.email, role: inserted.role, avatar: '', bio: '', status: 'active', createdAt: inserted.created_at }; created = true; }
            } catch (e2) { console.error('Failed to create profile via admin client:', e2) }
          }
        }
        if (user && user.status === 'active') {
          dbInstance.log('User Sign-In', `Logged in as: ${user.name} (${user.role})`, user.id, user.name);
          return res.json({ token: data.session.access_token, user });
        }
      }
    } catch (e) { console.error('Supabase login error:', e) }
  }
  const user = await dbInstance.getUserByEmail(safeEmail);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!await (dbInstance as any).verifyPassword?.(user.id, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  dbInstance.log('User Sign-In', `Logged in as: ${user.name} (${user.role})`, user.id, user.name);
  res.json({ token: `token-${user.id}`, user });
});

router.get('/me', authenticate, (req, res) => res.json((req as any).user));

router.put('/profile', authenticate, async (req, res) => {
  const u = (req as any).user;
  const { name, bio, avatar, password } = req.body;
  const updates: any = {};
  if (name) updates.name = sanitize(name.substring(0, 100));
  if (bio !== undefined) updates.bio = sanitize(bio.substring(0, 500));
  if (avatar !== undefined) updates.avatar = avatar;
  res.json(await dbInstance.updateUser(u.id, { name: updates.name || u.name, bio: updates.bio !== undefined ? updates.bio : u.bio, avatar: updates.avatar !== undefined ? updates.avatar : u.avatar }, password || undefined));
});

export default router;

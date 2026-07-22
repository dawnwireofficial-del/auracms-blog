import express from 'express';
import { dbInstance, useSupabase } from '../../server/db';
import { getSupabase } from '../../server/lib/supabase';

export async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  const token = authHeader.split(' ')[1];
  if (token.startsWith('token-')) {
    const userId = token.substring(6);
    let user = await dbInstance.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    if (user.status !== 'active') return res.status(401).json({ error: 'Unauthorized: Account suspended' });
    (req as any).user = user;
    return next();
  }
  if (useSupabase) {
    try {
      const { data, error } = await getSupabase().auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
      const user = await dbInstance.getUserById(data.user.id);
      if (!user || user.status !== 'active') return res.status(401).json({ error: 'Unauthorized: User not found or suspended' });
      (req as any).user = user;
      next();
    } catch { return res.status(500).json({ error: 'Authentication service error' }); }
  } else {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    next();
  };
}

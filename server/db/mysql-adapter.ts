/**
 * MySQL backend — drop-in replacement for the supabase-js client surface.
 * Activated when MYSQL_URL is set (see server/lib/supabase.ts + server/db.ts).
 */
import mysql from 'mysql2/promise';
import crypto from 'crypto';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'srv1932.hstgr.io',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'u916810702_dawnwire',
  password: process.env.MYSQL_PASSWORD || '!M7oD*srOX',
  database: process.env.MYSQL_DATABASE || 'u916810702_dawnwire',
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0,
});

// Columns stored as JSON strings (Postgres jsonb / text[] equivalents)
const JSON_COLUMNS: Record<string, string[]> = {
  product_reviews: ['pros', 'cons', 'key_features', 'seo_keywords', 'specs', 'gallery', 'variants', 'review_highlights'],
  posts: ['tags', 'seo_keywords'],
  affiliate_links: ['clicks_by_date', 'clicks_by_page'],
  homepage_sections: ['settings'],
  category_sections: ['settings'],
};

function encodeVal(v: any): any {
  if (v === undefined) return null;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

function decodeRow(table: string, row: any): any {
  if (!row) return row;
  const cols = JSON_COLUMNS[table];
  if (cols) {
    for (const c of cols) {
      if (row[c] != null && typeof row[c] === 'string') {
        try { row[c] = JSON.parse(row[c]); } catch { /* keep raw string */ }
      }
    }
  }
  return row;
}

export class SBQuery {
  private table: string;
  private mode: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private cols = '*';
  private payload: any = null;
  private onConflictCols = 'id';
  private wheres: string[] = [];
  private wparams: any[] = [];
  private orders: string[] = [];
  private limitVal: number | null = null;
  private offsetVal: number | null = null;
  private wantCount = false;
  private headOnly = false;

  constructor(table: string) { this.table = table; }

  select(columns?: string, options?: { count?: string; head?: boolean }): SBQuery {
    if (columns && columns !== '*') this.cols = columns;
    if ((options as any)?.count) this.wantCount = true;
    if ((options as any)?.head) this.headOnly = true;
    return this;
  }
  insert(payload: any): SBQuery { this.mode = 'insert'; this.payload = payload; return this; }
  upsert(payload: any, opts?: { onConflict?: string | string[] }): SBQuery {
    this.mode = 'upsert'; this.payload = payload;
    if (opts?.onConflict) this.onConflictCols = Array.isArray(opts.onConflict) ? opts.onConflict.join(',') : String(opts.onConflict);
    return this;
  }
  update(payload: any): SBQuery { this.mode = 'update'; this.payload = payload; return this; }
  delete(): SBQuery { this.mode = 'delete'; return this; }

  private w(sql: string, params: any[]) { this.wheres.push(sql); this.wparams.push(...params); }
  eq(c: string, v: any) { this.w('`' + c + '` = ?', [encodeVal(v)]); return this; }
  neq(c: string, v: any) { this.w('`' + c + '` != ?', [encodeVal(v)]); return this; }
  gt(c: string, v: any) { this.w('`' + c + '` > ?', [v]); return this; }
  gte(c: string, v: any) { this.w('`' + c + '` >= ?', [v]); return this; }
  lt(c: string, v: any) { this.w('`' + c + '` < ?', [v]); return this; }
  lte(c: string, v: any) { this.w('`' + c + '` <= ?', [v]); return this; }
  like(c: string, p: string) { this.w('`' + c + '` LIKE ?', [p]); return this; }
  ilike(c: string, p: string) { this.w('LOWER(`' + c + '`) LIKE ?', [String(p).toLowerCase()]); return this; }
  in(c: string, vals: any[]) {
    if (!vals || vals.length === 0) { this.w('1=0', []); return this; }
    this.w('`' + c + '` IN (' + vals.map(() => '?').join(',') + ')', vals.map(encodeVal));
    return this;
  }
  is(c: string, v: any) {
    if (v === null) this.w('`' + c + '` IS NULL', []);
    else this.w('`' + c + '` = ?', [v]);
    return this;
  }
  contains(c: string, v: string) { this.w('`' + c + '` LIKE ?', ['%' + v + '%']); return this; }
  or(expr: string) {
    const pieces = String(expr).split(',');
    const sqlParts: string[] = [];
    const params: any[] = [];
    for (const piece of pieces) {
      const m = piece.trim().match(/^(\w+)\.(eq|neq|gt|gte|lt|lte|like|ilike)\.(.*)$/);
      if (!m) { sqlParts.push('1=1'); continue; }
      const col = '`' + m[1] + '`';
      const op = m[2];
      const val = m[3].replace(/^"|"$/g, '');
      if (op === 'eq') { sqlParts.push(col + ' = ?'); params.push(val); }
      else if (op === 'neq') { sqlParts.push(col + ' != ?'); params.push(val); }
      else if (op === 'gt') { sqlParts.push(col + ' > ?'); params.push(val); }
      else if (op === 'gte') { sqlParts.push(col + ' >= ?'); params.push(val); }
      else if (op === 'lt') { sqlParts.push(col + ' < ?'); params.push(val); }
      else if (op === 'lte') { sqlParts.push(col + ' <= ?'); params.push(val); }
      else { sqlParts.push('LOWER(' + col + ') LIKE ?'); params.push(val.toLowerCase()); }
    }
    this.w('(' + sqlParts.join(' OR ') + ')', params);
    return this;
  }
  not(c: string, v: any) { return this.neq(c, v); }

  order(c: string, opts?: { ascending?: boolean }): SBQuery {
    this.orders.push('`' + c + '` ' + (opts?.ascending === false ? 'DESC' : 'ASC'));
    return this;
  }
  range(from: number, to: number): SBQuery { this.offsetVal = from; this.limitVal = to - from + 1; return this; }
  limit(n: number): SBQuery { this.limitVal = n; return this; }

  single() {
    return this.exec().then((r: any) => {
      const rows = Array.isArray(r.data) ? r.data : (r.data != null ? [r.data] : []);
      if (rows.length === 0) return { data: null, error: { code: 'PGRST116', message: 'No rows found' }, count: r.count ?? null };
      return { data: rows[0], error: null, count: r.count ?? null };
    });
  }
  maybeSingle() {
    return this.exec().then((r: any) => {
      const rows = Array.isArray(r.data) ? r.data : (r.data != null ? [r.data] : []);
      return { data: rows[0] ?? null, error: null, count: r.count ?? null };
    });
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
  catch(onR?: any) { return this.exec().catch(onR); }

  private whereSql(): string {
    return this.wheres.length ? ' WHERE ' + this.wheres.join(' AND ') : '';
  }

  private async exec(): Promise<{ data: any; error: any; count: number | null }> {
    try {
      const t = '`' + this.table + '`';
      if (this.mode === 'select') {
        let sql = 'SELECT ' + this.cols + ' FROM ' + t + this.whereSql();
        if (this.orders.length) sql += ' ORDER BY ' + this.orders.join(', ');
        if (this.limitVal != null) sql += ' LIMIT ' + Number(this.limitVal);
        if (this.offsetVal != null) sql += ' OFFSET ' + Number(this.offsetVal);
        const [rows] = await pool.query(sql, this.wparams);
        const data = (rows as any[]).map(r => decodeRow(this.table, r));
        let count: number | null = null;
        if (this.wantCount) {
          const [cr] = await pool.query('SELECT COUNT(*) AS c FROM ' + t + this.whereSql(), this.wparams);
          count = Number((cr as any)[0].c);
        }
        if (this.headOnly) return { data: null, error: null, count };
        return { data, error: null, count };
      }

      if (this.mode === 'insert' || this.mode === 'upsert') {
        const rowsArr = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const r of rowsArr) if (!r.id) r.id = crypto.randomUUID();
        const allCols = [...new Set(rowsArr.flatMap(r => Object.keys(r)))];
        const values = rowsArr.map(r => allCols.map(c => encodeVal(r[c])));
        const idCols = this.onConflictCols.split(',');
        const updateClause = allCols.filter(c => !idCols.includes(c))
          .map(c => '`' + c + '` = VALUES(`' + c + '`)').join(', ');
        let sql = 'INSERT INTO ' + t + ' (`' + allCols.join('`,`') + '`) VALUES ' +
          values.map(() => '(' + allCols.map(() => '?').join(',') + ')').join(',');
        if (this.mode === 'upsert' && updateClause) sql += ' ON DUPLICATE KEY UPDATE ' + updateClause;
        await pool.query(sql, values.flat());
        const ids = rowsArr.map(r => r.id);
        const [back] = await pool.query('SELECT * FROM ' + t + ' WHERE id IN (' + ids.map(() => '?').join(',') + ')', ids);
        const data = (back as any[]).map(r => decodeRow(this.table, r));
        return Array.isArray(this.payload)
          ? { data, error: null, count: null }
          : { data: data[0] ?? null, error: null, count: null };
      }

      if (this.mode === 'update') {
        const cols = Object.keys(this.payload);
        if (cols.length === 0) return { data: null, error: null, count: null };
        const setClause = cols.map(c => '`' + c + '` = ?').join(', ');
        const params = [...cols.map(c => encodeVal(this.payload[c])), ...this.wparams];
        await pool.query('UPDATE ' + t + ' SET ' + setClause + this.whereSql(), params);
        const [back] = await pool.query('SELECT * FROM ' + t + this.whereSql(), this.wparams);
        const data = (back as any[]).map(r => decodeRow(this.table, r));
        return { data: data[0] ?? null, error: null, count: null };
      }

      if (this.mode === 'delete') {
        const [res] = await pool.query('DELETE FROM ' + t + this.whereSql(), this.wparams);
        return { data: [], error: null, count: (res as any).affectedRows };
      }

      return { data: null, error: { message: 'Unknown mode' }, count: null };
    } catch (e: any) {
      console.error('[MySQL:' + this.table + ':' + this.mode + ']', e.message);
      return { data: null, error: { message: e.message, code: e.code }, count: null };
    }
  }
}

export function createSupabaseClient() {
  return {
    from: (table: string) => new SBQuery(table),
    rpc: async () => ({ data: null, error: { message: 'RPC not supported on MySQL' } }),
  };
}
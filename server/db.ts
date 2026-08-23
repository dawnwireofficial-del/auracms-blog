import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SupabaseDatabase } from './db/supabase-db';
import { Database as LegacyDatabase, dbInstance as legacyDb } from './db/legacy-db';
import { MySQLDatabase } from './db/mysql-database';

interface IDatabase {
  getContentUpgrades(): any;
  createContentUpgrade(data: any): any;
  updateContentUpgrade(id: string, updates: any): any;
  deleteContentUpgrade(id: string): any;
  trackUpgradeDownload(id: string): any;
  getTopicClusters(): any;
  createTopicCluster(data: any): any;
  updateTopicCluster(id: string, updates: any): any;
  deleteTopicCluster(id: string): any;
  [key: string]: any;
}

type DatabaseInstance = SupabaseDatabase | LegacyDatabase | MySQLDatabase;

let dbInstance: DatabaseInstance;
let useSupabase = false;
let supabaseReady = false;
let useMysql = !!process.env.MYSQL_URL;

if (process.env.MYSQL_URL) {
  try {
    dbInstance = new MySQLDatabase();
    useMysql = true;
    console.log('[DB] MySQL backend initialized');
  } catch (e) {
    console.log('[DB] MySQL init failed, falling back to Supabase:', (e as Error).message);
    useMysql = false;
  }
}

if (!useMysql && process.env.SUPABASE_URL) {
  try {
    dbInstance = new SupabaseDatabase();
    useSupabase = true;
    supabaseReady = true;
    console.log('[DB] Supabase backend initialized');
  } catch (e) {
    dbInstance = legacyDb;
    console.log('[DB] Supabase init failed, using legacy:', (e as Error).message);
  }
} else if (!useMysql) {
  dbInstance = legacyDb;
  console.log('[DB] Supabase not configured, using local JSON file backend');
}

export function generateId(): string {
  return crypto.randomUUID();
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { dbInstance, useSupabase, supabaseReady, useMysql };
export type { DatabaseInstance };

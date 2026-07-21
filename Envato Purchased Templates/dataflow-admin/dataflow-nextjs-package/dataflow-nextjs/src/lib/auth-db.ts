import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

const DB_PATH = path.join(process.cwd(), "auth.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");

    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT
      );

      INSERT OR IGNORE INTO users (id, email) VALUES ('1', 'admin@gmail.com');

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (user_id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        sale_price REAL,
        date TEXT,
        brand TEXT,
        sku TEXT,
        stock TEXT,
        tags TEXT,
        description TEXT,
        color TEXT,
        size TEXT,
        categories TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS attributes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        permissions TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        store_data TEXT NOT NULL DEFAULT '{}',
        profile_data TEXT NOT NULL DEFAULT '{}'
      );

      INSERT OR IGNORE INTO settings (id, store_data, profile_data) VALUES (1, '{}', '{}');
    `);

    const admin = _db
      .prepare("SELECT password_hash FROM users WHERE id = '1'")
      .get() as { password_hash: string | null } | undefined;

    if (admin && !admin.password_hash) {
      const hash = bcrypt.hashSync("123456", 10);
      _db.prepare("UPDATE users SET password_hash = ? WHERE id = '1'").run(hash);
    }
  }

  return _db;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  password_hash: string | null;
};

export function findUserByEmail(email: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function createUser(email: string, passwordHash: string): User {
  const id = randomUUID();
  getDb().prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, passwordHash);
  return { id, email, password_hash: passwordHash };
}

export function upsertResetToken(userId: string, tokenHash: string, expiresAt: Date): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
    .run(userId, tokenHash, expiresAt.getTime());
}

export function consumeResetToken(tokenHash: string): { userId: string } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?")
    .get(tokenHash, Date.now()) as { user_id: string } | undefined;
  if (!row) return null;
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(row.user_id);
  return { userId: row.user_id };
}

export function updatePassword(userId: string, passwordHash: string): void {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
}

// ─── Products ────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  title: string;
  price: number;
  sale_price: number | null;
  date: string | null;
  brand: string | null;
  sku: string | null;
  stock: string | null;
  tags: string | null;
  description: string | null;
  color: string | null;
  size: string | null;
  categories: string | null;
};

export function createProduct(data: Omit<Product, "id">): Product {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO products
         (id, title, price, sale_price, date, brand, sku, stock, tags, description, color, size, categories)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, data.title, data.price, data.sale_price ?? null, data.date ?? null,
      data.brand ?? null, data.sku ?? null, data.stock ?? null, data.tags ?? null,
      data.description ?? null, data.color ?? null, data.size ?? null, data.categories ?? null
    );
  return { id, ...data };
}

export function updateProduct(id: string, data: Omit<Product, "id">): void {
  getDb()
    .prepare(
      `UPDATE products SET
         title=?, price=?, sale_price=?, date=?, brand=?, sku=?, stock=?, tags=?,
         description=?, color=?, size=?, categories=?
       WHERE id=?`
    )
    .run(
      data.title, data.price, data.sale_price ?? null, data.date ?? null,
      data.brand ?? null, data.sku ?? null, data.stock ?? null, data.tags ?? null,
      data.description ?? null, data.color ?? null, data.size ?? null, data.categories ?? null,
      id
    );
}

// ─── Categories ──────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  image_url: string | null;
};

export function createCategory(name: string, imageUrl?: string): Category {
  const id = randomUUID();
  getDb().prepare("INSERT INTO categories (id, name, image_url) VALUES (?, ?, ?)").run(id, name, imageUrl ?? null);
  return { id, name, image_url: imageUrl ?? null };
}

// ─── Attributes ──────────────────────────────────────────────────────────────

export type Attribute = {
  id: string;
  name: string;
  value: string;
};

export function createAttribute(name: string, value: string): Attribute {
  const id = randomUUID();
  getDb().prepare("INSERT INTO attributes (id, name, value) VALUES (?, ?, ?)").run(id, name, value);
  return { id, name, value };
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export type Staff = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  permissions: string;
};

export function findStaffByEmail(email: string): Staff | undefined {
  return getDb().prepare("SELECT * FROM staff WHERE email = ?").get(email) as Staff | undefined;
}

export async function createStaff(
  name: string,
  email: string,
  password: string,
  permissions: Record<string, string>
): Promise<Omit<Staff, "password_hash">> {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const permissionsJson = JSON.stringify(permissions);
  getDb()
    .prepare("INSERT INTO staff (id, name, email, password_hash, permissions) VALUES (?, ?, ?, ?, ?)")
    .run(id, name, email, passwordHash, permissionsJson);
  return { id, name, email, permissions: permissionsJson };
}

// ─── Settings ────────────────────────────────────────────────────────────────

type SettingsRow = { store_data: string; profile_data: string };

export function getStoreSettings(): Record<string, unknown> {
  const row = getDb().prepare("SELECT store_data FROM settings WHERE id = 1").get() as SettingsRow | undefined;
  return JSON.parse(row?.store_data || "{}");
}

export function getProfileSettings(): Record<string, unknown> {
  const row = getDb().prepare("SELECT profile_data FROM settings WHERE id = 1").get() as SettingsRow | undefined;
  return JSON.parse(row?.profile_data || "{}");
}

export function saveStoreSettings(data: Record<string, unknown>): void {
  getDb().prepare("UPDATE settings SET store_data = ? WHERE id = 1").run(JSON.stringify(data));
}

export function saveProfileSettings(data: Record<string, unknown>): void {
  getDb().prepare("UPDATE settings SET profile_data = ? WHERE id = 1").run(JSON.stringify(data));
}

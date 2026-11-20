import "server-only";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// SQLite integrado en Node (sin dependencias externas). Se carga en tiempo de
// ejecución para que el empaquetador de Next no intente resolverlo.
type SqliteModule = typeof import("node:sqlite");
const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as SqliteModule;
export type DB = InstanceType<SqliteModule["DatabaseSync"]>;

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "kinetix.db");

declare global {
  // eslint-disable-next-line no-var
  var __kinetixDb: DB | undefined;
}

export function db(): DB {
  if (globalThis.__kinetixDb) return globalThis.__kinetixDb;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new DatabaseSync(DB_PATH);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000;");
  migrate(conn);
  seed(conn);
  globalThis.__kinetixDb = conn;
  return conn;
}

/** Ejecuta fn dentro de una transacción; revierte si lanza un error. */
export function tx<T>(fn: (d: DB) => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn(d);
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

function migrate(d: DB) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      size TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      compare_cents INTEGER,
      warning TEXT,
      style TEXT NOT NULL DEFAULT 'cream',
      active INTEGER NOT NULL DEFAULT 1,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color_a TEXT NOT NULL,
      color_b TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      district TEXT NOT NULL,
      notes TEXT,
      payment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nuevo',
      total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES variants(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      unit_cents INTEGER NOT NULL,
      qty INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      pass_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
  `);
}

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

function seed(d: DB) {
  const n = d.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  if (n.n === 0) {
    const insP = d.prepare(`INSERT INTO products (slug,name,tagline,description,size,price_cents,compare_cents,warning,style,sort)
      VALUES (?,?,?,?,?,?,?,?,?,?)`);
    const insV = d.prepare("INSERT INTO variants (product_id,name,color_a,color_b,stock,sort) VALUES (?,?,?,?,?,?)");
    const products = [
      {
        slug: "c-prix", name: "C-PRIX", tagline: "Carbohidratos + electrolitos",
        description: "25 g de carbohidratos y 200 mg de sodio por scoop, con sal rosada amazónica. Ratio 1:0.8 maltodextrina + fructosa.",
        size: "900 g · 34 porciones", price: 9500, compare: 11000, warning: "Alto en azúcar · Alto en sodio", style: "cream",
        variants: [["Naranja", "EC6B3B", "F0C020", 60], ["Frutos Rojos", "B41B6E", "EB5FA3", 60]],
      },
      {
        slug: "hyd-prix", name: "HYD-PRIX", tagline: "Electrolitos en polvo",
        description: "300 mg de sodio, 150 mg de potasio, 63 mg de calcio y 36 mg de magnesio por porción. Sabor natural, sin colorantes.",
        size: "100 g · 33 porciones", price: 3500, compare: null, warning: null, style: "dark",
        variants: [["Maracumango", "F7922B", "F7922B", 40], ["Limón", "A7CF3A", "A7CF3A", 40]],
      },
      {
        slug: "raw", name: "RAW", tagline: "Electrolitos sin sabor",
        description: "La misma composición de electrolitos que HYD-PRIX, sin saborizantes ni colorantes. Ideal para mezclar con C-PRIX.",
        size: "100 g · 33 porciones", price: 3000, compare: null, warning: null, style: "light",
        variants: [["Sin sabor", "2A8FD4", "2A8FD4", 40]],
      },
    ];
    products.forEach((p, i) => {
      const r = insP.run(p.slug, p.name, p.tagline, p.description, p.size, p.price, p.compare, p.warning, p.style, i);
      p.variants.forEach(([name, a, b, stock], j) => insV.run(Number(r.lastInsertRowid), name, a, b, stock, j));
    });
  }
  const u = d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (u.n === 0) {
    d.prepare("INSERT INTO users (email,name,pass_hash) VALUES (?,?,?)")
      .run("admin@kinetix.pe", "Administrador", hashPassword("kinetix2026"));
  }
}

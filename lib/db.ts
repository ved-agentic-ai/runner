import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'owner';
  plan: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  provider: 'stripe' | 'paypal';
  status: 'active' | 'cancelled';
  createdAt: string;
}

// Local File-Based DB fallback for npm run dev
const DB_FILE = path.join(process.cwd(), 'dev_database.json');

function readDb(): { users: UserRecord[]; subscriptions: SubscriptionRecord[] } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local DB file:', err);
  }
  return { users: [], subscriptions: [] };
}

function writeDb(data: { users: UserRecord[]; subscriptions: SubscriptionRecord[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local DB file:', err);
  }
}

// PostgreSQL Serverless Query Helper (Connects to Vercel Postgres / Neon if POSTGRES_URL is present)
async function queryPostgres(text: string, params: any[] = []): Promise<any> {
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!postgresUrl) return null;

  try {
    // Dynamic import for Vercel Serverless Postgres
    const { sql } = await import('@vercel/postgres');
    // Initialize schema if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        plan VARCHAR(50) DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return { isPostgres: true };
  } catch (err) {
    console.warn('Postgres connection fallback to local store:', err);
    return null;
  }
}

export const db = {
  // Find User by Email (Supports PostgreSQL & Local Dev DB)
  findUserByEmail: async (email: string): Promise<UserRecord | null> => {
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (postgresUrl) {
      try {
        const { sql } = await import('@vercel/postgres');
        const { rows } = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1;`;
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            passwordHash: r.password_hash,
            role: r.role || 'user',
            plan: r.plan || 'free',
            stripeCustomerId: r.stripe_customer_id,
            createdAt: r.created_at
          };
        }
      } catch (err) {
        console.warn('Postgres query error, using local fallback:', err);
      }
    }

    // Local Dev Fallback
    const { users } = readDb();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return found || null;
  },

  // Find User by ID
  findUserById: async (id: string): Promise<UserRecord | null> => {
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (postgresUrl) {
      try {
        const { sql } = await import('@vercel/postgres');
        const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            passwordHash: r.password_hash,
            role: r.role || 'user',
            plan: r.plan || 'free',
            stripeCustomerId: r.stripe_customer_id,
            createdAt: r.created_at
          };
        }
      } catch (err) {
        console.warn('Postgres query error, using local fallback:', err);
      }
    }

    const { users } = readDb();
    const found = users.find((u) => u.id === id);
    return found || null;
  },

  // Create New User
  createUser: async (user: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord> => {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (postgresUrl) {
      try {
        const { sql } = await import('@vercel/postgres');
        await sql`
          INSERT INTO users (id, name, email, password_hash, role, plan, created_at)
          VALUES (${id}, ${user.name}, ${user.email}, ${user.passwordHash}, ${user.role}, ${user.plan}, ${createdAt});
        `;
        return { ...user, id, createdAt };
      } catch (err) {
        console.warn('Postgres insert error, saving to local fallback:', err);
      }
    }

    const state = readDb();
    const newUser: UserRecord = { ...user, id, createdAt };
    state.users.push(newUser);
    writeDb(state);
    return newUser;
  },

  // Update User Plan
  updateUserPlan: async (userId: string, plan: 'free' | 'pro' | 'enterprise'): Promise<boolean> => {
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (postgresUrl) {
      try {
        const { sql } = await import('@vercel/postgres');
        await sql`UPDATE users SET plan = ${plan} WHERE id = ${userId};`;
        return true;
      } catch (err) {
        console.warn('Postgres update error:', err);
      }
    }

    const state = readDb();
    const userIndex = state.users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.users[userIndex].plan = plan;
      writeDb(state);
      return true;
    }
    return false;
  },

  // Create Subscription Record
  createSubscription: async (sub: Omit<SubscriptionRecord, 'id' | 'createdAt'>): Promise<SubscriptionRecord> => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    const state = readDb();
    const newSub: SubscriptionRecord = { ...sub, id, createdAt };
    state.subscriptions.push(newSub);
    writeDb(state);
    return newSub;
  }
};

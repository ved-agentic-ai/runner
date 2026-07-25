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

export interface UserFileRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'collection' | 'env';
  content: string;
  isRedacted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Local File-Based DB fallback for npm run dev
const DB_FILE = path.join(process.cwd(), 'dev_database.json');

function readDb(): { users: UserRecord[]; subscriptions: SubscriptionRecord[]; userFiles?: UserFileRecord[] } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || [],
        subscriptions: parsed.subscriptions || [],
        userFiles: parsed.userFiles || []
      };
    }
  } catch (err) {
    console.error('Error reading local DB file:', err);
  }
  return { users: [], subscriptions: [], userFiles: [] };
}

function writeDb(data: { users: UserRecord[]; subscriptions: SubscriptionRecord[]; userFiles?: UserFileRecord[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local DB file:', err);
  }
}

export const db = {
  // Find User by Email
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

  // Save User File (Collection or Env File)
  saveUserFile: async (file: Omit<UserFileRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserFileRecord> => {
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newFile: UserFileRecord = { ...file, id, createdAt: now, updatedAt: now };

    const state = readDb();
    if (!state.userFiles) state.userFiles = [];
    
    // Replace if same filename exists for user
    const existingIdx = state.userFiles.findIndex((f) => f.userId === file.userId && f.fileName === file.fileName);
    if (existingIdx !== -1) {
      newFile.createdAt = state.userFiles[existingIdx].createdAt;
      state.userFiles[existingIdx] = newFile;
    } else {
      state.userFiles.unshift(newFile);
    }

    writeDb(state);
    return newFile;
  },

  // Get All Files for User
  getUserFiles: async (userId: string): Promise<UserFileRecord[]> => {
    const state = readDb();
    const files = state.userFiles || [];
    return files.filter((f) => f.userId === userId);
  },

  // Delete User File
  deleteUserFile: async (fileId: string, userId: string): Promise<boolean> => {
    const state = readDb();
    if (!state.userFiles) return false;
    const initialLen = state.userFiles.length;
    state.userFiles = state.userFiles.filter((f) => !(f.id === fileId && f.userId === userId));
    writeDb(state);
    return state.userFiles.length < initialLen;
  }
};

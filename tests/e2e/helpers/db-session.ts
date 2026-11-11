import postgres from 'postgres';
import { E2E_DATABASE_URL } from '../e2e-env';

const COOKIE = 'authjs.session-token';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DbSession {
  /** Value of the authjs.session-token cookie. */
  token: string;
  userId: string;
  email: string;
  /** Display name: the account button in the header is labelled with it. */
  name: string;
  /** Adds the cookie to a browser context. */
  cookie: (baseURL: string) => { name: string; value: string; url: string; httpOnly: boolean; sameSite: 'Lax' };
  /** Removes the session and user again. */
  cleanup: () => Promise<void>;
}

/**
 * Signs a user in by writing the session row straight into the e2e database, for runs against a
 * production build, where the test-only login endpoint (/api/e2e/session) is switched off on
 * purpose. It touches only scout_toolkit_e2e.
 */
export async function createDbSession(options: { name?: string } = {}): Promise<DbSession> {
  const sql = postgres(E2E_DATABASE_URL, { max: 1 });
  const email = `e2e.pwa.${crypto.randomUUID()}@example.com`;
  const name = options.name ?? 'Chefe PWA';
  const token = crypto.randomUUID();
  try {
    const [row] = await sql<{ id: string }[]>`
      insert into "user" (email, name, role) values (${email}, ${name}, 'user') returning id`;
    const userId = row!.id;
    await sql`insert into "session" ("sessionToken", "userId", expires) values (${token}, ${userId}, ${new Date(Date.now() + DAY_MS)})`;
    return {
      token,
      userId,
      email,
      name,
      cookie: (baseURL) => ({ name: COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: 'Lax' }),
      cleanup: async () => {
        const db = postgres(E2E_DATABASE_URL, { max: 1 });
        try {
          await db`delete from "user" where id = ${userId}`; // sessions cascade
        } finally {
          await db.end();
        }
      },
    };
  } finally {
    await sql.end();
  }
}

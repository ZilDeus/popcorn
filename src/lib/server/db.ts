import { DATABASE_URL } from "$env/static/private";
import { users } from "$src/db_schema";
import { eq } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
const client = postgres(DATABASE_URL)
export const db = drizzle(client);
export const GetUserById = async (id: number) => {
  const user = await db.select({ username: users.username, id: users.id }).from(users).where(eq(users.id, id));
  if (user.length == 1) {
    return user[0];
  }
  return null;
}

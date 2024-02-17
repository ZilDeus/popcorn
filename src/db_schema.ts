import { pgTable, serial, text, date } from "drizzle-orm/pg-core";
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  createdAt: date('created_at').defaultNow(),
});

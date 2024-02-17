import { z } from "zod";
export const sign_up = z.object({
  email: z.string().email("Please enter a valid email."),
  username: z.string().trim().min(1),
  password: z.string().min(6).max(12),
});
export type sign_upSchema = typeof sign_up;

export const sign_in = z.object({
  email_or_username: z.string().trim(),
  password: z.string().min(6).max(12),
});
export type sign_inSchema = typeof sign_in;

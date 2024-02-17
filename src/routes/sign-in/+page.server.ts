import { superValidate } from "sveltekit-superforms/server";
import { sign_in } from "$src/schema";
import { dev } from "$app/environment";
import { fail, type RequestEvent } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { users } from "$src/db_schema";
import { and, eq } from "drizzle-orm";

export const actions = {
  default: async (event: RequestEvent) => {
    const form = await superValidate(event, sign_in);
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    const formEntries = form.data;
    try {
      let user: any;
      if (formEntries.email_or_username.includes("@"))
        user = await db.select().from(users).where(and(
          eq(users.email, formEntries.email_or_username)
          , eq(users.password, formEntries.password)));
      else
        user = await db.select().from(users).where(and(
          eq(users.username, formEntries.email_or_username)
          , eq(users.password, formEntries.password)));
      if (user.length == 1) {
        console.log("SUCCESS");
        event.cookies.set("session_id", user[0].id, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: !dev,
          maxAge: 60 * 60 * 24 * 7,
        });
        console.log("cookie was set to ", event.cookies.get("session_id"));
      } else {
        throw Error("email or password are wrong");
      }
    } catch (e) {
      console.log("FAIL");
      return fail(400, {
        form,
      });
    }
  },
};
export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(sign_in),
  };
};

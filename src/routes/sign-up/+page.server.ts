import type { PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { sign_up } from "$src/schema";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { users } from "$src/db_schema";

export const actions = {
  default: async (event: any) => {
    const form = await superValidate(event, sign_up);
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    const formEntries = form.data;
    try {
      await db.insert(users).values({
        username: formEntries.username,
        email: formEntries.email,
        password: formEntries.password,
        createdAt: new Date().toString(),
      });
      console.log("SUCCESS");
    } catch (e) {
      console.log("FAIL");
      return fail(400, {
        form,
      });
    }
  },
};
export const load: PageServerLoad = async ({ url }) => {
  return {
    form: await superValidate(sign_up),
  };
};

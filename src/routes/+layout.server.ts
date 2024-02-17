import { GetUserById } from "$lib/server/db";
import type { RequestEvent } from "@sveltejs/kit";
export async function load(event: RequestEvent) {
  const id = event.cookies.get("session_id");
  if (id) {
    const user = await GetUserById(parseInt(id));
    console.log(user);
    if (user) {
      return {
        user: user
      }
    }
  }
  return {
    user: null
  }
}

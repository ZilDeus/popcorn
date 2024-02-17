import { GetUserById } from "$src/lib/server/db";
import { redirect, type RequestEvent } from "@sveltejs/kit";
export const ssr = false;
export async function load(event: RequestEvent) {
  const id = event.cookies.get("session_id");
  if (!id) {
    redirect(303, "/sign-up");
  }
  const user = await GetUserById(parseInt(id));
  if (!user) {
    redirect(303, "/");
  }
  return {
    user,
    roomId: event.params.id,
  }
}


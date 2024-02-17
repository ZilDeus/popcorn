import { redirect, type RequestEvent } from "@sveltejs/kit";
export async function load(event: RequestEvent) {
  const id = event.cookies.get("session_id");
  if (!id)
    redirect(303, "/sign-in")

}
export const actions = {
  default: async (event: RequestEvent) => {
    event.cookies.delete("session_id",
      {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
      });
  }
}

import { PUBLIC_SERVER_URL } from "$env/static/public";
export async function getRoom(id: string | undefined) {
  if (!id)
    return null;
  try {
    const res = await fetch(`${PUBLIC_SERVER_URL}/room/${id}`);
    await res.json();
  } catch {
    return null;
  }
  return true;
}

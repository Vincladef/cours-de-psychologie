import { fetchJson } from "./index";

export async function advanceIteration(params: {
  userId: number;
  courseId?: number | null;
}): Promise<{ updated: number }> {
  const payload = await fetchJson("/iterations/advance", {
    method: "POST",
    body: JSON.stringify({
      userId: params.userId,
      courseId: params.courseId ?? undefined,
    }),
  });
  return payload as { updated: number };
}

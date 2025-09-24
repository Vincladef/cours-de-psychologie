import { fetchJson } from "./index";

export interface CourseHole {
  id: string;
  text: string;
  points: number;
}

export type Rating = "oui" | "plutot_oui" | "neutre" | "plutot_non" | "non";

export async function getCourseHoles(
  courseId: number,
  userId: number
): Promise<CourseHole[]> {
  const payload = await fetchJson(
    `/courses/${courseId}/holes?userId=${userId}`
  );
  return payload as CourseHole[];
}

export async function reviewHole(
  holeId: string,
  userId: number,
  rating: Rating
): Promise<{ holeId: string; points: number }> {
  const payload = await fetchJson(`/holes/${holeId}/review`, {
    method: "POST",
    body: JSON.stringify({ userId, rating }),
  });
  return payload as { holeId: string; points: number };
}

export const RATINGS: { label: string; value: Rating }[] = [
  { label: "Oui", value: "oui" },
  { label: "Plutôt oui", value: "plutot_oui" },
  { label: "Neutre", value: "neutre" },
  { label: "Plutôt non", value: "plutot_non" },
  { label: "Non", value: "non" },
];

import { fetchJson } from "./index";
import type { HoleMatch } from "../lib/holeParser";

export interface CourseSummary {
  id: number;
  title: string;
  updated_at: string;
}

export interface CourseDetail {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function listCourses(userId: number): Promise<CourseSummary[]> {
  const response = await fetchJson(`/courses?userId=${userId}`);
  return response as CourseSummary[];
}

export async function createCourse(
  userId: number,
  title: string
): Promise<CourseDetail> {
  const payload = await fetchJson("/courses", {
    method: "POST",
    body: JSON.stringify({ userId, title, content: "" }),
  });
  return payload as CourseDetail;
}

export async function getCourse(courseId: number): Promise<CourseDetail> {
  const payload = await fetchJson(`/courses/${courseId}`);
  return payload as CourseDetail;
}

export async function updateCourse(
  courseId: number,
  data: Partial<Pick<CourseDetail, "title" | "content">>
): Promise<CourseDetail> {
  const payload = await fetchJson(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return payload as CourseDetail;
}

export async function deleteCourse(courseId: number): Promise<void> {
  await fetchJson(`/courses/${courseId}`, {
    method: "DELETE",
  });
}

export async function syncCourseHoles(
  courseId: number,
  holes: HoleMatch[]
): Promise<void> {
  await fetchJson(`/courses/${courseId}/sync-holes`, {
    method: "POST",
    body: JSON.stringify({ holes }),
  });
}

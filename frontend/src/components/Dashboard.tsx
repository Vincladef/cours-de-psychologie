import { useEffect, useState } from "react";
import {
  createCourse,
  deleteCourse,
  listCourses,
  type CourseSummary,
} from "../api/courses";

interface DashboardProps {
  userId: number;
  onOpenCourse: (course: CourseSummary) => void;
  refreshKey: number;
}

export default function Dashboard({
  userId,
  onOpenCourse,
  refreshKey,
}: DashboardProps) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    listCourses(userId)
      .then((data) => {
        if (isMounted) {
          setCourses(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [userId, refreshKey]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError("Merci de saisir un titre.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createCourse(userId, title);
      setNewTitle("");
      const updated = await listCourses(userId);
      setCourses(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!window.confirm("Supprimer ce cours ?")) {
      return;
    }
    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="card">
      <h2>Vos cours</h2>
      <form onSubmit={handleCreate} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Nouveau cours"
        />
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? "Création..." : "Créer"}
        </button>
      </form>
      {error && <div className="status-bar alert-error">{error}</div>}
      {loading ? (
        <p>Chargement...</p>
      ) : courses.length === 0 ? (
        <p>Aucun cours pour l'instant. Créez votre premier cours !</p>
      ) : (
        <div className="course-list">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <strong>{course.title}</strong>
              <span>Mis à jour : {new Date(course.updated_at).toLocaleString()}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => onOpenCourse(course)}
                >
                  Ouvrir
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(course.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

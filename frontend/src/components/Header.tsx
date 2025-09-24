import type { StoredUser } from "../lib/storage";

type Mode = "edit" | "review";

interface HeaderProps {
  user: StoredUser | null;
  courseTitle?: string;
  showCourseActions: boolean;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onBack?: () => void;
  onAdvanceIteration?: () => void;
  iterationLoading?: boolean;
}

export default function Header({
  user,
  courseTitle,
  showCourseActions,
  mode,
  onModeChange,
  onBack,
  onAdvanceIteration,
  iterationLoading,
}: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>Cours à trous</h1>
        {courseTitle && <div className="status-bar">{courseTitle}</div>}
      </div>
      <div className="header-actions">
        {user && <span>👤 {user.username}</span>}
        {showCourseActions && (
          <>
            {onBack && (
              <button className="btn btn-secondary" onClick={onBack}>
                ← Retour
              </button>
            )}
            <div className="mode-toggle">
              <button
                className={mode === "review" ? "active" : ""}
                onClick={() => onModeChange("review")}
              >
                Révision
              </button>
              <button
                className={mode === "edit" ? "active" : ""}
                onClick={() => onModeChange("edit")}
              >
                Édition
              </button>
            </div>
            {onAdvanceIteration && (
              <button
                className="btn btn-primary"
                onClick={onAdvanceIteration}
                disabled={iterationLoading}
              >
                {iterationLoading ? "Itération..." : "Nouvelle itération"}
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}

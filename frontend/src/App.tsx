import { useEffect, useState } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Editor from "./components/Editor";
import Review from "./components/Review";
import { loadUser, saveUser, type StoredUser } from "./lib/storage";
import type { CourseSummary } from "./api/courses";
import { advanceIteration } from "./api/iterations";

type Mode = "review" | "edit";

export default function App() {
  const [user, setUser] = useState<StoredUser | null>(() => loadUser());
  const [mode, setMode] = useState<Mode>("review");
  const [currentCourse, setCurrentCourse] = useState<CourseSummary | null>(null);
  const [iterationLoading, setIterationLoading] = useState(false);
  const [iterationMessage, setIterationMessage] = useState<string | null>(null);
  const [iterationState, setIterationState] = useState<"success" | "error" | null>(null);
  const [refreshCourses, setRefreshCourses] = useState(0);
  const [refreshHoles, setRefreshHoles] = useState(0);

  useEffect(() => {
    const stored = loadUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  const handleLogin = (logged: StoredUser) => {
    saveUser(logged);
    setUser(logged);
    setIterationMessage(null);
    setIterationState(null);
  };

  const handleOpenCourse = (course: CourseSummary) => {
    setCurrentCourse(course);
    setMode("review");
    setIterationMessage(null);
    setIterationState(null);
  };

  const handleBackToDashboard = () => {
    setCurrentCourse(null);
    setIterationMessage(null);
    setIterationState(null);
    setRefreshCourses((value) => value + 1);
  };

  const handleCourseTitle = (title: string) => {
    setCurrentCourse((prev) => (prev ? { ...prev, title } : prev));
  };

  const handleAdvanceIteration = async () => {
    if (!user) {
      return;
    }
    setIterationLoading(true);
    setIterationMessage(null);
    setIterationState(null);
    try {
      const result = await advanceIteration({
        userId: user.id,
        courseId: currentCourse?.id,
      });
      const count = result.updated;
      setIterationMessage(
        count > 0
          ? `${count} trou${count > 1 ? "s" : ""} décrémenté${count > 1 ? "s" : ""}.`
          : "Aucun trou à décrémenter."
      );
      setIterationState("success");
      setRefreshHoles((value) => value + 1);
    } catch (err) {
      setIterationMessage(err instanceof Error ? err.message : String(err));
      setIterationState("error");
    } finally {
      setIterationLoading(false);
    }
  };

  const isLogged = Boolean(user);
  const hasActiveCourse = Boolean(isLogged && currentCourse);

  let content: JSX.Element | null = null;

  if (!isLogged) {
    content = <Login onLogged={handleLogin} />;
  } else if (!hasActiveCourse) {
    content = (
      <Dashboard
        userId={user!.id}
        onOpenCourse={handleOpenCourse}
        refreshKey={refreshCourses}
      />
    );
  } else if (mode === "edit") {
    content = (
      <Editor courseId={currentCourse!.id} onCourseLoaded={handleCourseTitle} />
    );
  } else {
    content = (
      <Review
        courseId={currentCourse!.id}
        userId={user!.id}
        refreshKey={refreshHoles}
        onCourseLoaded={handleCourseTitle}
      />
    );
  }

  return (
    <div className="app-container">
      {isLogged && (
        <Header
          user={user}
          courseTitle={currentCourse?.title}
          showCourseActions={hasActiveCourse}
          mode={mode}
          onModeChange={setMode}
          onBack={hasActiveCourse ? handleBackToDashboard : undefined}
          onAdvanceIteration={
            hasActiveCourse ? handleAdvanceIteration : undefined
          }
          iterationLoading={iterationLoading}
        />
      )}
      <main className={isLogged ? "main-content" : "landing-content"}>
        {content}
      </main>
      {iterationMessage && (
        <div
          className={`status-bar ${
            iterationState === "error"
              ? "alert-error"
              : iterationState === "success"
              ? "alert-success"
              : ""
          }`}
          style={{ marginTop: "16px" }}
        >
          {iterationMessage}
        </div>
      )}
    </div>
  );
}

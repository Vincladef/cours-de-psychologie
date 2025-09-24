import { useEffect, useRef, useState } from "react";
import {
  getCourse,
  syncCourseHoles,
  updateCourse,
  type CourseDetail,
} from "../api/courses";
import { extractHoles } from "../lib/holeParser";

interface EditorProps {
  courseId: number;
  onCourseLoaded: (title: string) => void;
}

export default function Editor({ courseId, onCourseLoaded }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCourse(courseId)
      .then((data) => {
        setCourse(data);
        setTitle(data.title);
        setContent(data.content);
        onCourseLoaded(data.title);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [courseId, onCourseLoaded]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const applyFormat = (command: string) => {
    document.execCommand(command);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleCreateHole = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setStatus("Sélectionnez du texte pour créer un trou.");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      setStatus("Sélectionnez du texte à l'intérieur de l'éditeur.");
      return;
    }
    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setStatus("La sélection est vide.");
      return;
    }
    const id = crypto.randomUUID();
    const placeholder = `[[HOLE:${id}|${selectedText}]]`;
    range.deleteContents();
    range.insertNode(document.createTextNode(placeholder));
    selection.removeAllRanges();
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    setStatus(`Trou ${id} ajouté.`);
  };

  const handleSave = async () => {
    if (!course) {
      return;
    }
    setSaving(true);
    setError(null);
    setStatus(null);
    const holes = extractHoles(content);
    try {
      const updated = await updateCourse(course.id, { title, content });
      await syncCourseHoles(course.id, holes);
      setCourse(updated);
      onCourseLoaded(updated.title);
      setStatus("Cours enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card">Chargement...</div>;
  }

  if (error && !course) {
    return <div className="card alert-error">{error}</div>;
  }

  return (
    <div className="editor-container">
      <div className="card">
        <label htmlFor="course-title">Titre du cours</label>
        <input
          id="course-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="card">
        <div className="editor-toolbar">
          <button className="btn btn-secondary" type="button" onClick={() => applyFormat("bold")}>
            Gras
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => applyFormat("italic")}>
            Italique
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => applyFormat("insertUnorderedList")}>
            Liste
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleCreateHole}>
            Mettre en trou
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
        <div
          className="editor-surface"
          contentEditable
          suppressContentEditableWarning
          ref={editorRef}
          onInput={(event) => setContent((event.target as HTMLDivElement).innerHTML)}
        />
        <div className="status-bar">
          {status && <span className="alert-success">{status}</span>}
          {error && <span className="alert-error">{error}</span>}
        </div>
        <div className="status-bar">
          Trous détectés : {extractHoles(content).length}
        </div>
      </div>
    </div>
  );
}

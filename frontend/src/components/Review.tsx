import { useEffect, useMemo, useState } from "react";
import { getCourse, type CourseDetail } from "../api/courses";
import {
  getCourseHoles,
  reviewHole,
  RATINGS,
  type CourseHole,
  type Rating,
} from "../api/holes";
import { segmentContent, type ContentSegment } from "../lib/holeParser";

interface ReviewProps {
  courseId: number;
  userId: number;
  refreshKey: number;
  onCourseLoaded: (title: string) => void;
}

type ReviewState = Record<string, boolean>;
type LoadingMap = Record<string, boolean>;

export default function Review({
  courseId,
  userId,
  refreshKey,
  onCourseLoaded,
}: ReviewProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [segments, setSegments] = useState<ContentSegment[]>([]);
  const [holes, setHoles] = useState<Record<string, CourseHole>>({});
  const [revealed, setRevealed] = useState<ReviewState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingHole, setLoadingHole] = useState<LoadingMap>({});

  const reload = () => {
    setLoading(true);
    setError(null);
    Promise.all([getCourse(courseId), getCourseHoles(courseId, userId)])
      .then(([courseData, holeData]) => {
        setCourse(courseData);
        setSegments(segmentContent(courseData.content));
        const map: Record<string, CourseHole> = {};
        const initialReveal: ReviewState = {};
        holeData.forEach((hole) => {
          map[hole.id] = hole;
          initialReveal[hole.id] = hole.points > 0;
        });
        setHoles(map);
        setRevealed(initialReveal);
        onCourseLoaded(courseData.title);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId, refreshKey]);

  const holeCount = useMemo(() => Object.keys(holes).length, [holes]);

  const handleReveal = (holeId: string) => {
    setRevealed((prev) => ({ ...prev, [holeId]: true }));
  };

  const handleReview = async (holeId: string, rating: Rating) => {
    setLoadingHole((prev) => ({ ...prev, [holeId]: true }));
    setError(null);
    try {
      const result = await reviewHole(holeId, userId, rating);
      setHoles((prev) => ({
        ...prev,
        [holeId]: { ...prev[holeId], points: result.points },
      }));
      setRevealed((prev) => ({ ...prev, [holeId]: result.points > 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingHole((prev) => ({ ...prev, [holeId]: false }));
    }
  };

  if (loading) {
    return <div className="card">Chargement...</div>;
  }

  if (error && !course) {
    return <div className="card alert-error">{error}</div>;
  }

  return (
    <div className="card review-content">
      {error && <div className="status-bar alert-error">{error}</div>}
      <div className="status-bar">{holeCount} trous synchronisés</div>
      <div>
        {segments.map((segment, index) => {
          if (segment.type === "html") {
            return (
              <span
                key={`html-${index}`}
                dangerouslySetInnerHTML={{ __html: segment.html }}
              />
            );
          }
          const hole = holes[segment.id];
          const isRevealed = revealed[segment.id];
          const isLoading = loadingHole[segment.id];
          const text = hole ? hole.text : segment.text;
          const points = hole ? hole.points : 0;
          return (
            <span key={segment.id} className="review-hole">
              {isRevealed ? (
                <span className="text">{text}</span>
              ) : (
                <button
                  className="hidden-btn"
                  type="button"
                  onClick={() => handleReveal(segment.id)}
                >
                  [ ... ]
                </button>
              )}
              <span className="hole-chip">{points} pt</span>
              {isRevealed && (
                <span className="likert">
                  {RATINGS.map((rating) => (
                    <button
                      key={rating.value}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleReview(segment.id, rating.value)}
                    >
                      {rating.label}
                    </button>
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

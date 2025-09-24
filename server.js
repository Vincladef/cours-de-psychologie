const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const dbPath = process.env.DB_PATH || path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS holes (
      id TEXT PRIMARY KEY,
      course_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS hole_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hole_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      points REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hole_id, user_id),
      FOREIGN KEY(hole_id) REFERENCES holes(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        console.error("SQL run error", { query, params, err });
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error("SQL get error", { query, params, err });
        return reject(err);
      }
      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("SQL all error", { query, params, err });
        return reject(err);
      }
      resolve(rows);
    });
  });
}

app.get("/", (req, res) => {
  res.send("Backend SQLite opérationnel !");
});

app.get("/users", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Le paramètre username est requis." });
  }

  try {
    const user = await get("SELECT id, username FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.post("/users", async (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Le champ username est requis." });
  }

  try {
    const result = await run("INSERT INTO users (username) VALUES (?)", [username]);
    const user = await get("SELECT id, username FROM users WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(user);
  } catch (err) {
    if (err && err.message && err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "Ce pseudo est déjà utilisé." });
    }
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.get("/courses", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Le paramètre userId est requis." });
  }

  try {
    const courses = await all(
      `SELECT id, title, updated_at FROM courses WHERE user_id = ? ORDER BY datetime(updated_at) DESC`,
      [userId]
    );
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.post("/courses", async (req, res) => {
  const { userId, title, content } = req.body || {};
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0 || !title) {
    return res.status(400).json({ error: "userId et title sont requis." });
  }

  try {
    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO courses (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [numericUserId, title, typeof content === "string" ? content : "", now, now]
    );
    const course = await get(
      `SELECT id, user_id, title, content, created_at, updated_at FROM courses WHERE id = ?`,
      [result.lastID]
    );
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.get("/courses/:courseId", async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: "Identifiant de cours invalide." });
  }

  try {
    const course = await get(
      `SELECT id, user_id, title, content, created_at, updated_at FROM courses WHERE id = ?`,
      [courseId]
    );
    if (!course) {
      return res.status(404).json({ error: "Cours introuvable." });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.put("/courses/:courseId", async (req, res) => {
  const courseId = Number(req.params.courseId);
  const { title, content } = req.body || {};
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: "Identifiant de cours invalide." });
  }
  if (typeof title === "undefined" && typeof content === "undefined") {
    return res.status(400).json({ error: "Aucun champ à mettre à jour." });
  }

  const updates = [];
  const params = [];
  if (typeof title !== "undefined") {
    updates.push("title = ?");
    params.push(title);
  }
  if (typeof content !== "undefined") {
    updates.push("content = ?");
    params.push(typeof content === "string" ? content : "");
  }
  updates.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(courseId);

  try {
    const result = await run(
      `UPDATE courses SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    if (!result.changes) {
      return res.status(404).json({ error: "Cours introuvable." });
    }
    const course = await get(
      `SELECT id, user_id, title, content, created_at, updated_at FROM courses WHERE id = ?`,
      [courseId]
    );
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.delete("/courses/:courseId", async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: "Identifiant de cours invalide." });
  }

  try {
    await run(
      `DELETE FROM hole_states WHERE hole_id IN (SELECT id FROM holes WHERE course_id = ?)`,
      [courseId]
    );
    await run(`DELETE FROM holes WHERE course_id = ?`, [courseId]);
    const result = await run(`DELETE FROM courses WHERE id = ?`, [courseId]);
    if (!result.changes) {
      return res.status(404).json({ error: "Cours introuvable." });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.post("/courses/:courseId/sync-holes", async (req, res) => {
  const courseId = Number(req.params.courseId);
  const { holes } = req.body || {};
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: "Identifiant de cours invalide." });
  }
  if (!Array.isArray(holes)) {
    return res.status(400).json({ error: "holes doit être un tableau." });
  }

  const validHoles = holes.filter(
    (h) => h && typeof h.id === "string" && typeof h.text === "string"
  );

  try {
    const course = await get(`SELECT id FROM courses WHERE id = ?`, [courseId]);
    if (!course) {
      return res.status(404).json({ error: "Cours introuvable." });
    }

    for (const hole of validHoles) {
      await run(
        `INSERT INTO holes (id, course_id, original_text) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET original_text = excluded.original_text, course_id = excluded.course_id`,
        [hole.id, courseId, hole.text]
      );
    }

    res.json({ synced: validHoles.length });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.get("/courses/:courseId/holes", async (req, res) => {
  const courseId = Number(req.params.courseId);
  const userId = Number(req.query.userId);
  if (!Number.isInteger(courseId) || courseId <= 0 || !Number.isInteger(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ error: "courseId et userId sont requis." });
  }

  try {
    const holes = await all(
      `SELECT h.id, h.original_text AS text, IFNULL(s.points, 0) AS points
       FROM holes h
       LEFT JOIN hole_states s ON s.hole_id = h.id AND s.user_id = ?
       WHERE h.course_id = ?
       ORDER BY h.id`,
      [userId, courseId]
    );
    res.json(holes);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.post("/holes/:holeId/review", async (req, res) => {
  const { holeId } = req.params;
  const { userId, rating } = req.body || {};
  const numericUserId = Number(userId);
  if (!holeId || !Number.isInteger(numericUserId) || numericUserId <= 0 || typeof rating !== "string") {
    return res
      .status(400)
      .json({ error: "holeId, userId et rating sont requis." });
  }

  const increments = {
    oui: 1,
    "plutot_oui": 0.5,
    neutre: null,
    "plutot_non": null,
    non: null,
  };

  if (!(rating in increments)) {
    return res.status(400).json({ error: "rating invalide." });
  }

  try {
    const existing = await get(
      `SELECT points FROM hole_states WHERE hole_id = ? AND user_id = ?`,
      [holeId, numericUserId]
    );
    let points = existing ? Number(existing.points) : 0;
    const increment = increments[rating];

    if (increment !== null) {
      points += increment;
    } else {
      points = 0;
    }

    if (existing) {
      await run(
        `UPDATE hole_states SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE hole_id = ? AND user_id = ?`,
        [points, holeId, numericUserId]
      );
    } else {
      await run(
        `INSERT INTO hole_states (hole_id, user_id, points, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [holeId, numericUserId, points]
      );
    }

    res.json({ holeId, points });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.post("/iterations/advance", async (req, res) => {
  const { userId, courseId } = req.body || {};
  const numericUserId = Number(userId);
  const numericCourseId = courseId ? Number(courseId) : undefined;
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ error: "userId est requis." });
  }

  try {
    const params = [numericUserId];
    let query =
      "UPDATE hole_states SET points = CASE WHEN points - 1 < 0 THEN 0 ELSE points - 1 END, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?";

    if (numericCourseId && Number.isInteger(numericCourseId) && numericCourseId > 0) {
      query +=
        " AND hole_id IN (SELECT id FROM holes WHERE course_id = ? )";
      params.push(numericCourseId);
    }

    const result = await run(query, params);
    res.json({ updated: result.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne." });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Erreur interne." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

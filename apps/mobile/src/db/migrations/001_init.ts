export const sql = `
CREATE TABLE episodes (
  id            TEXT PRIMARY KEY,          -- uuid v4
  created_at    INTEGER NOT NULL,          -- unix ms, UTC
  tz_offset     INTEGER NOT NULL,          -- minutes from UTC when captured
  intensity     INTEGER NOT NULL
                CHECK (intensity BETWEEN 0 AND 10),
  fear          TEXT NOT NULL              -- the prediction, verbatim
                CHECK (length(trim(fear)) >= 3),
  probability   INTEGER NOT NULL           -- 0..100, stated confidence
                CHECK (probability BETWEEN 0 AND 100),
  tags          TEXT,                      -- json array, nullable
  followup_at   INTEGER NOT NULL,          -- unix ms
  notif_id      TEXT,                      -- local notification identifier
  locked        INTEGER NOT NULL DEFAULT 1 -- always 1
);

CREATE INDEX idx_episodes_created ON episodes(created_at DESC);

CREATE TABLE followups (
  episode_id     TEXT PRIMARY KEY REFERENCES episodes(id) ON DELETE CASCADE,
  completed_at   INTEGER NOT NULL,
  outcome        INTEGER NOT NULL          -- 0=did not happen, 1=partly, 2=happened
                 CHECK (outcome IN (0,1,2)),
  actual_impact  INTEGER                   -- 0..10, how bad it actually was
                 CHECK (actual_impact IS NULL OR actual_impact BETWEEN 0 AND 10),
  what_helped    TEXT,
  was_late       INTEGER NOT NULL DEFAULT 0 -- 1 when answered later than +48h
);

CREATE TABLE exercises (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  duration_sec  INTEGER NOT NULL,
  category      TEXT NOT NULL,             -- grounding|breathing|body|cognitive|behavioural
  body_md       TEXT NOT NULL,
  source_note   TEXT                       -- where the method comes from
);

CREATE TABLE exercise_logs (
  id            TEXT PRIMARY KEY,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  episode_id    TEXT REFERENCES episodes(id) ON DELETE SET NULL,
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,                   -- NULL means interrupted
  relief        INTEGER
                CHECK (relief IS NULL OR relief BETWEEN 0 AND 10)
);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
`;

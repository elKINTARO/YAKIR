/**
 * Turns "a prediction cannot be edited after creation" from a convention into
 * a property of the database. The only column that may change is notif_id,
 * because rescheduling a reminder is not an edit of what was predicted.
 */
export const sql = `
CREATE TRIGGER episodes_append_only
BEFORE UPDATE OF id, created_at, tz_offset, intensity, fear, probability,
                 tags, followup_at, locked
ON episodes
BEGIN
  SELECT RAISE(ABORT, 'episodes are append-only: only notif_id may change');
END;
`;

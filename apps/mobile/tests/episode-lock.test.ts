import { readdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { beforeEach, describe, expect, it } from 'vitest';

import { migrations } from '@/db/migrations';

/**
 * Rule two of the project: a prediction cannot be edited after it is made.
 * Checked twice, because either layer alone can be quietly undone: there is
 * no screen that could edit an episode, and the database refuses the edit
 * even if one appeared.
 */

const APP_DIR = path.resolve(import.meta.dirname, '../app');

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? routeFiles(full) : [full];
  });
}

describe('the app', () => {
  it('has no route that could edit an episode', () => {
    const routes = routeFiles(APP_DIR).map((file) =>
      path.relative(APP_DIR, file),
    );
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((route) => /edit/i.test(route))).toEqual([]);
  });
});

describe('the episodes table', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    for (const migration of migrations) {
      database.exec(migration.sql);
    }
    database
      .prepare(
        `INSERT INTO episodes
           (id, created_at, tz_offset, intensity, fear, probability, tags, followup_at)
         VALUES ('e1', 1, 180, 7, 'мене звільнять', 85, NULL, 2)`,
      )
      .run();
  });

  it.each([
    ['fear', "'мене не звільнять'"],
    ['probability', '10'],
    ['intensity', '2'],
    ['created_at', '5'],
    ['tz_offset', '0'],
    ['tags', `'["work"]'`],
    ['followup_at', '9'],
    ['locked', '0'],
    ['id', "'e2'"],
  ])('refuses to change %s', (column, value) => {
    expect(() =>
      database.exec(`UPDATE episodes SET ${column} = ${value} WHERE id = 'e1'`),
    ).toThrow(/append-only/);
  });

  it('lets the reminder id change, since that is not part of the prediction', () => {
    database.exec("UPDATE episodes SET notif_id = 'n1' WHERE id = 'e1'");
    const row = database
      .prepare("SELECT notif_id, fear FROM episodes WHERE id = 'e1'")
      .get();
    expect(row).toEqual({ notif_id: 'n1', fear: 'мене звільнять' });
  });

  it('still allows deleting an episode, which the settings screen needs', () => {
    database.exec("DELETE FROM episodes WHERE id = 'e1'");
    const row = database
      .prepare('SELECT COUNT(*) AS total FROM episodes')
      .get();
    expect(row).toEqual({ total: 0 });
  });

  it('stores new episodes locked', () => {
    const row = database
      .prepare("SELECT locked FROM episodes WHERE id = 'e1'")
      .get();
    expect(row).toEqual({ locked: 1 });
  });
});

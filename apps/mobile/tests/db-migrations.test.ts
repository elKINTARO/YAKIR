import { describe, expect, it } from 'vitest';

import {
  assertMigrationsAreWellFormed,
  migrations,
  type Migration,
} from '@/db/migrations';

describe('migrations', () => {
  it('are numbered from one without gaps', () => {
    expect(() => assertMigrationsAreWellFormed()).not.toThrow();
  });

  it('rejects a gap in the sequence', () => {
    const withGap: Migration[] = [
      { version: 1, name: 'first', sql: '' },
      { version: 3, name: 'third', sql: '' },
    ];
    expect(() => assertMigrationsAreWellFormed(withGap)).toThrow(/version 3/);
  });

  it('rejects migrations listed out of order', () => {
    const reversed: Migration[] = [
      { version: 2, name: 'second', sql: '' },
      { version: 1, name: 'first', sql: '' },
    ];
    expect(() => assertMigrationsAreWellFormed(reversed)).toThrow(/"second"/);
  });

  it('creates every table the specification names', () => {
    const schema = migrations.map((migration) => migration.sql).join('\n');
    for (const table of [
      'episodes',
      'followups',
      'exercises',
      'exercise_logs',
      'settings',
    ]) {
      expect(schema).toContain(`CREATE TABLE ${table}`);
    }
  });

  it('keeps the range checks on the recorded values', () => {
    const schema = migrations.map((migration) => migration.sql).join('\n');
    expect(schema).toContain('CHECK (intensity BETWEEN 0 AND 10)');
    expect(schema).toContain('CHECK (probability BETWEEN 0 AND 100)');
    expect(schema).toContain('CHECK (outcome IN (0,1,2))');
    expect(schema).toContain('CHECK (length(trim(fear)) >= 3)');
  });
});

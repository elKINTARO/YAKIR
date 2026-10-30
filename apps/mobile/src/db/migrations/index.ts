import { sql as init } from './001_init';
import { sql as appendOnlyEpisodes } from './002_append_only_episodes';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: readonly Migration[] = [
  { version: 1, name: '001_init', sql: init },
  { version: 2, name: '002_append_only_episodes', sql: appendOnlyEpisodes },
];

export function assertMigrationsAreWellFormed(
  list: readonly Migration[] = migrations,
): void {
  list.forEach((migration, index) => {
    const expected = index + 1;
    if (migration.version !== expected) {
      throw new Error(
        `Migration "${migration.name}" has version ${migration.version}, expected ${expected}.`,
      );
    }
  });
}

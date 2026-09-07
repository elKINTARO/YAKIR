import * as SQLite from 'expo-sqlite';

import { assertDatabaseIsEncrypted } from './encryption';
import { deleteDbKey, getOrCreateDbKey } from './key';
import { assertMigrationsAreWellFormed, migrations } from './migrations';

export const DATABASE_NAME = 'yakir.db';

let connection: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  connection ??= open();
  return connection;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  assertMigrationsAreWellFormed();

  const key = await getOrCreateDbKey();
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    await database.execAsync(`PRAGMA key = "x'${key}'"`);
    await database.execAsync('PRAGMA foreign_keys = ON');
    await runMigrations(database);
    if (__DEV__) {
      await assertDatabaseIsEncrypted(DATABASE_NAME);
    }
  } catch (error) {
    await database.closeAsync();
    throw error;
  }

  return database;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const applied = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= applied) {
      continue;
    }
    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

export async function destroyDatabase(): Promise<void> {
  if (connection) {
    const database = await connection;
    await database.closeAsync();
    connection = null;
  }
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  await deleteDbKey();
}

export function resetConnectionCache(): void {
  connection = null;
}

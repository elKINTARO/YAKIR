import { getDatabase } from '../client';

interface SettingRow {
  key: string;
  value: string;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SettingRow>(
    'SELECT key, value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SettingRow>(
    'SELECT key, value FROM settings',
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

/** The 16 bytes an unencrypted SQLite file begins with. */
const PLAINTEXT_MAGIC = 'SQLite format 3\0';

export type EncryptionCheck = 'encrypted' | 'plaintext' | 'absent';

export async function checkDatabaseEncryption(
  databaseName: string,
): Promise<EncryptionCheck> {
  const file = new File(String(SQLite.defaultDatabaseDirectory), databaseName);
  if (!file.exists) {
    return 'absent';
  }

  const bytes = await file.bytes();
  const header = String.fromCharCode(...bytes.slice(0, PLAINTEXT_MAGIC.length));
  return header === PLAINTEXT_MAGIC ? 'plaintext' : 'encrypted';
}

export async function assertDatabaseIsEncrypted(
  databaseName: string,
): Promise<void> {
  if ((await checkDatabaseEncryption(databaseName)) === 'plaintext') {
    throw new Error(
      `The database "${databaseName}" is readable as plain SQLite. SQLCipher is ` +
        'not active in this build. Check the useSQLCipher plugin option and rebuild.',
    );
  }
}

import path from 'path';
import sqlite3 from 'sqlite3';
import { app } from 'electron';
import { exec } from 'child_process';

const sqlite = sqlite3.verbose();
const dbFile = path.join(app.getPath('userData'), 'praise-deck.db');
const delimiter = ':::';
let db: sqlite3.Database;

console.log('dbFile', dbFile);

export function dbConnection(): void {
  db = new sqlite.Database(dbFile);
  db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS song (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tags TEXT,
      number TEXT NOT NULL,
      category TEXT,
      slides TEXT,
      active BOOLEAN DEFAULT 0
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS song_type (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

    db.get("SELECT COUNT(*) AS count FROM song_type", (err, row: any) => {
      if (!err && row && row.count === 0) {
        db.run("INSERT INTO song_type (name) VALUES ('Coro')");
        db.run("INSERT INTO song_type (name) VALUES ('Himno')");
        db.run("INSERT INTO song_type (name) VALUES ('Canto para Niños')");
      }
    });

    db.all(`PRAGMA table_info(song);`, (err, columns: any[]) => {
      if (err) {
        console.error('Error checking table schema', err.message);
        return;
      }

      const hasChorus = columns.some(col => col.name === 'chorus');
      if (!hasChorus) {
        db.run(`ALTER TABLE song ADD COLUMN chorus TEXT;`, (alterErr) => {
          if (alterErr) console.error('Error adding chorus column:', alterErr.message);
          else console.log('Column "chorus" added to song table');
        });
      }

      const hasTranslations = columns.some(col => col.name === 'translations');
      if (!hasTranslations) {
        db.run(`ALTER TABLE song ADD COLUMN translations TEXT;`, (alterErr) => {
          if (alterErr) console.error('Error adding translations column:', alterErr.message);
          else console.log('Column "translations" added to song table');
        });
      }
    });
  });
}

export function dbImport(sqlFile: string, callback: (msg: string, status: string) => void): void {
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS song;`, (dropErr) => {
      if (dropErr) {
        console.error('Error dropping the table:', dropErr.message);
        return;
      }
      console.log('Table "song" dropped, starting import...');

      exec(`sqlite3 "${dbFile}" < "${sqlFile}"`, (err, _stdout, stderr) => {
        if (err) {
          console.error('Error importing the SQL file:', err.message);
          return;
        }
        if (stderr) {
          console.error('Error during execution:', stderr);
          return;
        }
        callback('¡Datos importados correctamente!', 'success');
        console.log('SQL file successfully imported into', dbFile);
      });
    });
  });
}

export function dbExport(backupFile: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const dbPath = `"${dbFile}"`;
    const backupPath = `"${backupFile}"`;

    exec(`sqlite3 ${dbPath} .dump > ${backupPath}`, (err, _stdout, stderr) => {
      if (err) return reject('Error during backup: ' + err.message);
      if (stderr) return reject('Process error: ' + stderr);
      resolve(true);
    });
  });
}

function requestFailed(message: string) {
  return { error: true, message };
}

export function getSize(params: any): Promise<number> {
  const { searchText = '', category = '' } = params?.formData || {};
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count FROM song
      WHERE title LIKE ? AND number LIKE ? AND LOWER(category) LIKE LOWER(?);
    `;
    const queryParams = [`%${searchText}%`, `%${searchText}%`, `%${category}%`];

    db.get(query, queryParams, (err, row: any) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

export function getSongs(params: any): Promise<any[]> {
  const { searchText = '', category = '' } = params?.formData || {};
  const { pageSize, currentPage } = params || {};
  const offset = (currentPage - 1) * pageSize;

  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM song
      WHERE (title LIKE ? OR number LIKE ?) AND LOWER(category) LIKE LOWER(?)
      ORDER BY CAST(number AS INTEGER) ASC
      LIMIT ? OFFSET ?;
    `;
    const queryParams = [`%${searchText}%`, `%${searchText}%`, `%${category}%`, pageSize, offset];

    db.all(query, queryParams, (err, rows: any[]) => {
      if (err) reject(err);
      else {
        const songs = rows.map(({slides, chorus, translations, ...rest}) => ({
          slides: slides ? slides.split(delimiter) : [],
          chorus: chorus ? chorus.split(',').filter(Boolean) : [],
          translations: translations ? translations.split(delimiter) : [],
          ...rest,
        }));
        resolve(songs);
      }
    });
  });
}

export function getActiveSongs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM song WHERE active = 1`;
    db.all(query, (err, rows: any[]) => {
      if (err) reject(err);
      else {
        const songs = rows.map(({slides, chorus, translations, ...rest}) => ({
          slides: slides ? slides.split(delimiter) : [],
          chorus: chorus ? chorus.split(',').filter(Boolean) : [],
          translations: translations ? translations.split(delimiter) : [],
          ...rest,
        }));
        resolve(songs);
      }
    });
  });
}

export function addSong(songData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const { title, tags, number, category, slides, chorus, translations, active } = songData;

    if (!title || !number) {
      reject(requestFailed('Title and number are required fields.'));
      return;
    }

    const query = `
      INSERT INTO song (number, title, slides, category, tags, chorus, translations, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      number,
      title,
      slides.join(delimiter) || '',
      category || null,
      tags || null,
      chorus && chorus.length ? chorus.join(',') : null,
      translations && translations.length ? translations.join(delimiter) : null,
      active || 0,
    ];

    db.run(query, values, function (err) {
      if (err) reject(requestFailed('Error adding song to the database.'));
      else resolve({ success: true, songId: this.lastID });
    });
  });
}

export function updateSong(id: number, updatedFields: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof id !== 'number' || typeof updatedFields !== 'object' || Object.keys(updatedFields).length === 0) {
        reject(requestFailed('A valid ID and fields to update are required.'));
        return;
      }

      const payload = { ...updatedFields };

      if (payload.slides && Array.isArray(payload.slides)) payload.slides = payload.slides.join(delimiter);
      if (payload.chorus && Array.isArray(payload.chorus)) payload.chorus = payload.chorus.join(',');
      if (payload.translations && Array.isArray(payload.translations)) payload.translations = payload.translations.join(delimiter);

      const fields = Object.keys(payload).map((field) => `${field} = ?`).join(', ');
      const values = Object.values(payload);
      values.push(id); 

      const query = `UPDATE song SET ${fields} WHERE id = ?`;

      db.prepare(query).run(values, (err) => {
        if (err) {
          console.log('Error updating song', err);
          reject(requestFailed('Error updating song'));
        } else resolve();
      });
    } catch (error) {
      console.log('Error updating song', error);
      reject(requestFailed('Error updating song'));
    }
  });
}

export function getSongData(id: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      db.all('SELECT * FROM song WHERE id = ?', [id], (err, rows: any[]) => {
        if (err) reject(requestFailed('Error retrieving song from database'));
        else {
          const songs = rows.map(({slides, chorus, translations, ...rest}) => ({
            slides: slides ? slides.split(delimiter) : [],
            chorus: chorus ? chorus.split(',').filter(Boolean) : [],
            translations: translations ? translations.split(delimiter) : [],
            ...rest,
          }));
          resolve(songs);
        }
      });
    } catch (error) {
      reject(requestFailed('Error fetching song'));
    }
  });
}

export function deleteSong(id: number): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof id !== 'number') return reject(requestFailed('A valid ID is required.'));

    const query = `DELETE FROM song WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) reject(requestFailed(`Failed to delete the song: ${err.message}`));
      else if (this.changes === 0) reject(requestFailed('No song found with the provided ID.'));
      else resolve({ success: true, deletedId: id });
    });
  });
}

export function deleteSongsByCategory(category: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!category) return reject(requestFailed('A valid category is required.'));

    const query = `DELETE FROM song WHERE category = ?`;
    db.run(query, [category], function (err) {
      if (err) reject(requestFailed(`Failed to delete songs: ${err.message}`));
      else resolve({ success: true, deletedCount: this.changes });
    });
  });
}

export function getSongTypes(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM song_type ORDER BY name ASC", (err, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.name));
    });
  });
}

export function addSongType(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO song_type (name) VALUES (?)", [name], function (err) {
      if (err) reject(err);
      else resolve({ success: true, id: this.lastID });
    });
  });
}

export function updateSongType(oldName: string, newName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("UPDATE song_type SET name = ? WHERE name = ?", [newName, oldName], (err) => {
        if (err) { db.run("ROLLBACK"); return reject(err); }
        db.run("UPDATE song SET category = ? WHERE category = ?", [newName.toLowerCase(), oldName.toLowerCase()], (err2) => {
          if (err2) { db.run("ROLLBACK"); return reject(err2); }
          db.run("COMMIT", (commitErr) => {
            if (commitErr) reject(commitErr);
            else resolve({ success: true });
          });
        });
      });
    });
  });
}

export function deleteSongType(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM song_type WHERE name = ?", [name], function (err) {
      if (err) reject(err);
      else resolve({ success: true });
    });
  });
}

export function normalizeSongTypesCase(): Promise<{ updated: number }> {
  return new Promise((resolve, reject) => {
    function toTitleCase(str: string) {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    db.all("SELECT name FROM song_type", (err, rows: any[]) => {
      if (err) return reject(err);

      const updates = rows
        .map(r => ({ original: r.name, normalized: toTitleCase(r.name) }))
        .filter(u => u.original !== u.normalized);

      if (updates.length === 0) return resolve({ updated: 0 });

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        let failed = false;

        updates.forEach(({ original, normalized }) => {
          if (failed) return;
          db.run("UPDATE song_type SET name = ? WHERE name = ?", [normalized, original], (err) => {
            if (err && !failed) { failed = true; db.run("ROLLBACK"); reject(err); }
          });
          db.run(
            "UPDATE song SET category = ? WHERE LOWER(category) = LOWER(?)",
            [normalized, original],
            (err) => {
              if (err && !failed) { failed = true; db.run("ROLLBACK"); reject(err); }
            }
          );
        });

        db.run("COMMIT", (commitErr) => {
          if (commitErr && !failed) reject(commitErr);
          else if (!failed) resolve({ updated: updates.length });
        });
      });
    });
  });
}

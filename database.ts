import * as SQLite from 'expo-sqlite';

// Abrimos (o creamos si no existe) la base de datos local
export const db = SQLite.openDatabaseSync('universidad.db');

export const initDB = () => {
  // PRAGMA foreign_keys = ON asegura que SQLite respete las relaciones (1 a muchos)
  db.execSync(`
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS programas (
      codigo TEXT PRIMARY KEY CHECK(length(codigo) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30)
    );

    CREATE TABLE IF NOT EXISTS estudiantes (
      codigo TEXT PRIMARY KEY CHECK(length(codigo) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30),
      email TEXT CHECK(length(email) <= 100),
      programa_cod TEXT,
      FOREIGN KEY(programa_cod) REFERENCES programas(codigo) ON DELETE CASCADE
    );
  `);
};
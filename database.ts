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
      FOREIGN KEY(programa_cod) REFERENCES programas(codigo) ON DELETE CASCADE ON UPDATE CASCADE
    );

    -- ==========================================
    -- DATOS DE PRUEBA (SEED DATA)
    -- ==========================================
    
    -- Insertamos programas de prueba primero (porque los estudiantes dependen de ellos)
    INSERT OR IGNORE INTO programas (codigo, nombre) VALUES ('P001', 'Ing. de Sistemas');
    INSERT OR IGNORE INTO programas (codigo, nombre) VALUES ('P002', 'Medicina');
    INSERT OR IGNORE INTO programas (codigo, nombre) VALUES ('P003', 'Derecho');

    -- Insertamos estudiantes de prueba asignados a esos programas
    INSERT OR IGNORE INTO estudiantes (codigo, nombre, email, programa_cod) VALUES 
      ('E001', 'Ana Silva', 'ana.silva@udeb.com', 'P001');
      
    INSERT OR IGNORE INTO estudiantes (codigo, nombre, email, programa_cod) VALUES 
      ('E002', 'Luis Torres', 'luis.t@udeb.com', 'P002');
      
    INSERT OR IGNORE INTO estudiantes (codigo, nombre, email, programa_cod) VALUES 
      ('E003', 'Carlos Gomez', 'cgomez@udeb.com', 'P001');
      
    INSERT OR IGNORE INTO estudiantes (codigo, nombre, email, programa_cod) VALUES 
      ('E004', 'Maria Paz', 'maria.paz@udeb.com', 'P003');
  `);
};
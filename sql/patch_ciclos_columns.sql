-- Patch para columnas opcionales de ciclos
-- Ejecutar sólo las que falten (elimina líneas si ya existen)

ALTER TABLE ciclos_cultivo ADD COLUMN observaciones TEXT NULL;
ALTER TABLE ciclos_cultivo ADD COLUMN fecha_cosecha_real DATE NULL;
ALTER TABLE ciclos_cultivo ADD COLUMN avance_manual TINYINT UNSIGNED NULL;

-- Tabla de hitos (si aún no existe)
CREATE TABLE IF NOT EXISTS ciclos_hitos (
  id_hito INT AUTO_INCREMENT PRIMARY KEY,
  id_ciclo INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT NULL,
  fecha_objetivo DATE NULL,
  completado TINYINT(1) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ciclo) REFERENCES ciclos_cultivo(id_ciclo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ciclos_hitos_ciclo ON ciclos_hitos(id_ciclo);

# Progreso de Ciclos de Cultivo

Esta guía explica cómo funciona y cómo habilitar el sistema de progreso (avance) de los ciclos.

## Fuentes del porcentaje de avance
El backend calcula `avance_pct` usando la mejor fuente disponible:
1. Hitos (si existen registros en `ciclos_hitos` para el ciclo) => porcentaje = hitos completados / total * 100
2. Avance manual (`avance_manual`) si no hay hitos
3. Fechas estimadas (`fecha_inicio_estimada` y `fecha_fin_estimada`) como interpolación temporal
4. Si ninguna aplica => 0%

El campo `avance_origen` indica cuál se utilizó: `hitos`, `manual`, `fechas`, `indef`.

## Requisitos de esquema
Tabla base: `ciclos_cultivo`
Columnas opcionales pero recomendadas:
- `observaciones` (TEXT)
- `fecha_cosecha_real` (DATE)
- `avance_manual` (TINYINT UNSIGNED)

Tabla adicional para hitos: `ciclos_hitos`
Campos principales: `id_hito`, `id_ciclo`, `titulo`, `fecha_objetivo`, `completado`.

## Patch SQL recomendado
Archivo: `sql/patch_ciclos_columns.sql`
Ejecuta solamente las líneas que falten.

```sql
ALTER TABLE ciclos_cultivo ADD COLUMN observaciones TEXT NULL;
ALTER TABLE ciclos_cultivo ADD COLUMN fecha_cosecha_real DATE NULL;
ALTER TABLE ciclos_cultivo ADD COLUMN avance_manual TINYINT UNSIGNED NULL;

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
```

## Verificación rápida
1. `DESCRIBE ciclos_cultivo;` => debe listar `avance_manual` si quieres usar el slider.
2. `SHOW TABLES LIKE 'ciclos_hitos';` => comprueba que existe.
3. Endpoint diagnóstico: `GET /api/ciclos/schema/columns` devuelve columnas detectadas.
4. Refrescar caché tras patch: `GET /api/ciclos/schema/refresh`.

## Flujo de uso
1. Sin hitos y con columna `avance_manual` => aparece slider para guardar valor manual.
2. Cuando agregas el primer hito => el origen pasa a `hitos`; el valor manual se conserva pero se deja de usar.
3. Marcar/desmarcar hitos recalcula inmediatamente el porcentaje.
4. Si completas todos los hitos => `avance_pct` = 100.
 5. Puedes forzar el cierre con el botón "Marcar completado" (añadido) aunque falten hitos; esto fija `estado='completado'`, `avance_manual=100` (si existe columna), pone `fecha_cosecha_real=HOY` (si existe) y marca todos los hitos como completados si la tabla existe.

## Mensajes comunes
- "La columna avance_manual no existe": aplica el patch y refresca caché o reinicia servidor.
- "Nada que actualizar": el cuerpo del PUT no contenía campos válidos presentes en la tabla (ver columnas detectadas).

## Buenas prácticas
- Define hitos clave antes de iniciar el ciclo para que el seguimiento sea consistente.
- Evita usar avance manual y hitos a la vez (el sistema prioriza hitos).
- Usa `fecha_cosecha_real` para cerrar formalmente el ciclo (puedes añadir un botón futuro para completar ciclo automáticamente).

## Futuras extensiones (ideas)
- Reordenar hitos (drag & drop) actualizando `orden`.
- Auto establecer estado `completado` al llegar a 100% hitos.
- Historial de cambios de avance.
- Notificaciones cuando se exceden fechas objetivo de hitos no completados.

## Solución de problemas
| Problema | Causa probable | Acción |
|----------|----------------|-------|
| Slider no aparece | Falta columna `avance_manual` y tampoco hay hitos | Aplicar patch o crear hitos |
| Siempre 0% aunque muevo slider | PUT devuelve error o caché sin refrescar | Revisar Network, usar `/api/ciclos/schema/refresh` |
| Porcentaje incorrecto con hitos | Hitos sin marcar o duplicados | Ver lista de hitos, verificar completado |
| Error ER_BAD_FIELD_ERROR | Columnas no coinciden con código | Ejecutar patch de migración |

## Endpoint relevantes
- `PUT /api/ciclos/:id` cuerpo: `{ avance_manual: <0-100> }`
- `POST /api/ciclos/:id/hitos` crear hito
- `PATCH /api/hitos/:id/toggle` alternar completado
- `DELETE /api/hitos/:id` eliminar
- `GET /api/ciclos/:id` ver detalle con `avance_pct`
- `POST /api/ciclos/:id/complete` marcar ciclo como completado (idempotente)

---
Cualquier duda adicional revisa la consola del servidor para mensajes de diagnóstico añadidos por `ciclosApi.js`.

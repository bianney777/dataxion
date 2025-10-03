# DataXion – Plataforma de Gestión Agrícola Integral

Aplicación Node.js (Express + EJS + MySQL) para gestionar fincas, lotes, ciclos y el módulo avanzado de **Labores & Manejo Agrícola** (tipos de labores, labores ejecutadas, aplicaciones de insumos, riegos, insumos y categorías), con métricas en tiempo real, exportaciones CSV/PDF (incluyendo un PDF resumen multi‑sección) y una interfaz unificada.

## 🚀 Características principales
### Núcleo (Fincas / Lotes / Zonas)
- Autenticación protegida (`ensureAuthenticated`) y rol admin básico.
- CRUD de Fincas y Lotes con métricas (área, % activas, pH promedio, etc.).
- Integración con `zonas_geograficas` y soporte opcional a columna GEOMETRY.
- UI moderna: dark mode, skeletons, notificaciones, filtros y paginación ligera.

### Módulo Labores & Manejo Agrícola
- Vista unificada (sin tabs) que muestra simultáneamente:
  - Tipos de Labor
  - Labores ejecutadas
  - Aplicaciones de Insumos (deriva automáticamente el tipo desde el insumo)
  - Riegos
  - Insumos y Categorías de Insumos (catálogo)
- Select de insumos agrupado por categoría + filtro incremental en vivo.
- Etiquetas coloreadas (estado, tipo de insumo, etc.).
- Totales agregados por sección (costos, cantidades, volúmenes) mostrados en `<tfoot>` y replicados en exportaciones.
- Exportaciones: CSV/PDF por entidad + **PDF resumen multi‑sección** (Labores, Aplicaciones, Riegos, Catálogo de Insumos y totales globales).

### Métricas de Sesión / Usuarios
- Conteo runtime de visitantes únicos y usuarios activos (ventana deslizante de 5 minutos).
- Endpoint interno opcional de diagnóstico de rutas y `/health`.

### Exportaciones y Reportes
- CSV genéricos por entidad.
- PDF estilizados (pdfkit) para Insumos y resumen global.
- Posibilidad de ampliar a Excel/JSON sin romper estructura.

### Robustez & Operación
- Bootstrap con reconexión de DB (en `connectDB`), selección dinámica de puerto con fallback si está ocupado.
- Manejo de señales (`SIGINT`, `SIGTERM`) y apagado suave (graceful shutdown) del servidor.
- Handlers globales para `unhandledRejection` y `uncaughtException` que intentan cerrar el server antes de salir.
- Middleware de locals por defecto que evita errores EJS cuando faltan variables (`totals`, colecciones vacías, etc.).

## 📂 Estructura de carpetas (resumen)
```
config/           Configuración DB (mysql2)
controllers/      Lógica de negocio (auth, dashboard, gestionFinca)
middleware/       Autenticación
models/           Modelos: Finca, Lote, User, Zona, (TiposLabor, Labor, Aplicacion, Riego, Insumo, CategoriaInsumo, etc.)
public/           CSS/JS estático y estilos globales
routes/           Rutas Express
views/            Plantillas EJS (layout y páginas)
```

## 🛠 Requisitos
- Node.js 18+ recomendado
- MySQL >= 5.7 (ideal MariaDB / MySQL 8 para funciones espaciales)

## ⚙️ Variables de entorno (`.env`)
Ejemplo (adaptar):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_bd
JWT_SECRET=clave_super_secreta
PORT=5000
REQUEST_LOG=true               # (opcional) log de cada request
ENABLE_ROUTE_DEBUG=false       # activar endpoint /__routes
METRICS_LOG_INTERVAL_MS=30000  # intervalo log métricas
ENABLE_EMAIL_VERIFICATION=false
```
(No subir `.env` al repositorio)

## 🗄 Tablas mínimas (resumen núcleo)
(Adaptar según tu script real; el módulo de Labores requiere tablas adicionales: tipos_labores, labores_agricolas, aplicaciones, riegos, insumos, categorias_insumos, etc.)
```sql
CREATE TABLE zonas_geograficas (
  id_zona INT AUTO_INCREMENT PRIMARY KEY,
  nombre_zona VARCHAR(100),
  codigo_postal VARCHAR(20),
  pais VARCHAR(100),
  region VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fincas (
  id_finca INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_zona INT,
  nombre_finca VARCHAR(120) NOT NULL,
  ubicacion VARCHAR(255),
  area_total DECIMAL(10,4),
  latitud DECIMAL(12,8),
  longitud DECIMAL(12,8),
  altitud DECIMAL(10,2),
  descripcion TEXT,
  estado ENUM('activa','inactiva','en_planificacion') DEFAULT 'activa',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_zona) REFERENCES zonas_geograficas(id_zona)
);

CREATE TABLE lotes (
  id_lote INT AUTO_INCREMENT PRIMARY KEY,
  id_finca INT NOT NULL,
  nombre_lote VARCHAR(120) NOT NULL,
  area DECIMAL(10,4),
  coordenadas GEOMETRY NULL,
  descripcion TEXT,
  tipo_suelo ENUM('arcilloso','limoso','arenoso','franco','otros') DEFAULT 'franco',
  ph_suelo DECIMAL(4,2),
  capacidad_agua DECIMAL(10,2),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_finca) REFERENCES fincas(id_finca)
);
```

## ▶️ Instalación & ejecución
```bash
npm install
node app.js        # inicia bootstrap, intenta PORT o PORT+1 si ocupado
# o usando nodemon si instalado globalmente
```
Abrir: http://localhost:5000 (o el puerto mostrado en consola)

## 🔐 Autenticación
- Middleware `ensureAuthenticated` protege las rutas de gestión.
- Ajustar `authController` según tu implementación real de login/register.

## 🌐 Endpoints principales (parcial)
### Vistas
- `GET /gestionfinca` – Panel de gestión.
- `GET /gestionfinca/:id_finca/lotes` – Ver lotes de una finca.

### API Fincas
- `GET /gestionfinca/api/fincas?q=&estado=&page=&limit=`
- `GET /gestionfinca/api/fincas/metrics`

### API Lotes
- `GET /gestionfinca/api/fincas/:id_finca/lotes?q=&tipo_suelo=&page=&limit=`
- `GET /gestionfinca/api/fincas/:id_finca/lotes/metrics`

### API Zonas
- `GET /gestionfinca/api/zonas`

### Labores & Manejo
- `GET /labores` (vista unificada)
- Exportaciones (ejemplos):
  - `GET /labores/export/labores.csv`
  - `GET /labores/export/aplicaciones.csv`
  - `GET /labores/export/riegos.csv`
  - `GET /labores/export/insumos.pdf`
  - `GET /labores/export/summary/:cultivo.pdf`
  - (según parámetros implementados en controlador)

## 🧭 Manejo de coordenadas (GEOMETRY)
En `models/Lote.js`:
1. Intenta `ST_GeomFromText('POINT(lon lat)')`.
2. Si falla, prueba con `ST_SRID(...,4326)`.
3. Si vuelve a fallar, guarda `NULL` en `coordenadas` para no bloquear el alta.

Puedes luego mejorar: validar SRID real, usar `POINT(lon lat)` con índices espaciales, o separar lat/long en columnas adicionales.

## 📤 Exportaciones
Frontend (legacy) usa jsPDF / SheetJS para algunos catálogos. El módulo Labores utiliza generación server-side (pdfkit) para:
- PDF Insumos con encabezado estilizado.
- PDF Resumen multi‑sección (portada + tablas + totales).
- CSV simplificados generados desde controladores.

Extender: agregar Excel/JSON centralizado reutilizando los arrays en el controlador (`laboresController`).

## 🎨 UI / UX
- Dark mode persistente (localStorage).
- Skeleton loaders mientras carga data.
- Chips de métricas, badges con colores semánticos y etiquetas de tipo/estado.
- Select filtrable de insumos (normaliza acentos, agrupado por categoría).
- Tablas con `<tfoot>` para totales.

## 🧪 Tests
No incluidos aún. Sugerencias:
- Modelos: creación de finca, lote, labor, aplicación derivando tipo desde insumo.
- Controladores: exportaciones CSV/PDF (verificar cabeceras y contenido mínimo).
- Métricas runtime: simular múltiples requests y validar límites ventana activa.

## 🛠 Próximas mejoras sugeridas
- Paginación avanzada y filtros combinados en módulo Labores.
- Export global consolidado (JSON / Excel único).
- Mapa interactivo (Leaflet / Mapbox) para visualización de lotes y labores georreferenciadas.
- Validación robusta (joi / zod) y sanitización de entradas.
- Rate limiting + Helmet + CSRF tokens.
- Cache server-side (Redis) para métricas y catálogos poco cambiantes.
- Internacionalización (i18n) de etiquetas y PDF.

## 🤝 Contribución
1. Crea un branch descriptivo (`feat/labores-paginacion`).
2. Usa conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`...).
3. Ejecuta lint/tests (cuando existan) antes del PR.
4. Describe claramente qué módulo impacta y captura de pantalla si es UI.

## 📄 Licencia
ISC (ajustar según necesidad)

---
Hecho con foco en rendimiento y DX. Cualquier mejora que quieras, crea un issue o extiende el modelo. ¡Disfruta!


## 🧯 Troubleshooting
| Problema | Causa posible | Solución |
|----------|---------------|----------|
| `totals is not defined` en `labores.ejs` | Controlador no pasó variable | Middleware de locals ya mitiga; asegura calcular totales antes de render si corresponde |
| `server is not defined` en uncaughtException | Variable local no accesible | Definir `let server` global y asignar en `listen` (ya corregido) |
| Puerto en uso | Otro proceso en 5000 | El bootstrap intenta `PORT+1`; o libera proceso (`netstat` / `Get-NetTCPConnection`) |
| PDF vacío | Datos vacíos | Verifica filtros y que el cultivo seleccionado tenga registros |
| Métricas no muestran usuarios | JWT inválido o expirado | Re-login para refrescar token |

---
Hecho con foco en rendimiento, extensibilidad y DX. Para ideas nuevas abre un issue o envía un PR. 🌱

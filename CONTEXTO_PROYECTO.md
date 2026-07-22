# Contexto del Proyecto: ValoCoach AI — Beta 1.0

> **Documento de Traspaso Técnico Completo**  
> Última actualización: 22 de julio de 2026  
> Estado: **Beta Desplegado y Funcional en Producción**

Este documento es la fuente definitiva de verdad sobre el proyecto. Está diseñado para que cualquier IA, desarrollador o colaborador que llegue nuevo pueda entender al 100% la arquitectura, las decisiones de diseño, el stack tecnológico y el estado actual de ValoCoach AI desde el primer minuto.

---

## 1. Descripción del Producto

**ValoCoach AI** es una plataforma SaaS Full-Stack que actúa como analista táctico personal para jugadores de Valorant. El usuario introduce su `Riot ID` y `TAG`, y el sistema:

1. Extrae sus últimas 3 partidas en tiempo real desde la API de Valorant.
2. Calcula métricas de rendimiento de nivel profesional (KDA Ratio, Winrate).
3. Usa OpenAI GPT-4o-mini para generar un diagnóstico táctico personalizado con puntos débiles y metas concretas.
4. Muestra todo en un dashboard visual corporativo con gráficos interactivos.

**URL Desplegada (Beta):** `https://valocoach-bk5as7h34-ikers890.vercel.app/`  
**Repositorio GitHub:** `https://github.com/ikercuadrosruiz/valocoach-ai`

---

## 2. Estructura del Repositorio

```
valocoach-ai/                   ← Raíz del proyecto
├── backend/                    ← API Python (FastAPI)
│   ├── app/
│   │   ├── main.py             ← Controlador principal de la API
│   │   ├── database.py         ← Configuración PostgreSQL + Redis
│   │   ├── models.py           ← Modelos SQLAlchemy (tabla coach_advices)
│   │   └── logger.py           ← Módulo de logging profesional
│   ├── requirements.txt        ← Dependencias Python
│   ├── Dockerfile              ← Imagen Docker para despliegue en Render
│   └── .env                    ← Variables secretas (NO subir a Git)
├── frontend/                   ← Web App React (Next.js)
│   ├── src/app/
│   │   ├── page.tsx            ← Página Home (buscador de jugador)
│   │   ├── layout.tsx          ← Layout raíz con fuente Inter
│   │   ├── globals.css         ← Sistema de diseño completo (tokens, glassmorphism)
│   │   └── coach/[name]/[tag]/
│   │       └── page.tsx        ← Dashboard de resultados con gráficos
│   ├── .env.local              ← URL del backend para desarrollo local (NO subir a Git)
│   └── package.json            ← Dependencias Node.js
├── docker-compose.yml          ← PostgreSQL (puerto 5433) + Redis en local
├── .gitignore                  ← Excluye .env, venv/, node_modules/, .next/
├── COMANDOS_LOCAL.md           ← Guía rápida para arrancar en local
├── WEB_DESPLEGADA.md           ← URL de producción en Vercel
└── CONTEXTO_PROYECTO.md        ← Este archivo
```

---

## 3. Arquitectura del Sistema

El proyecto sigue una arquitectura cliente-servidor desacoplada de 3 capas:

```
[Usuario en Internet]
        ↓
[Vercel — Frontend Next.js]
        ↓ fetch a NEXT_PUBLIC_API_URL
[Render — Backend FastAPI (Docker)]
        ↓              ↓
[PostgreSQL Render]  [Redis Render]
        ↓
[Henrik API (Valorant)] + [OpenAI API]
```

---

## 4. Backend (FastAPI — Python)

### 4.1 Stack y Dependencias
```txt
fastapi         → Framework API REST
uvicorn         → Servidor ASGI (proceso principal)
sqlalchemy      → ORM para PostgreSQL
psycopg2-binary → Driver de PostgreSQL para Python
redis           → Cliente de Redis
openai          → Cliente oficial de OpenAI API
valo-api        → Wrapper para la Henrik Dev API de Valorant
python-dotenv   → Carga de variables de entorno desde .env
httpx           → Cliente HTTP asíncrono (dependencia de valo-api)
```

### 4.2 Variables de Entorno requeridas (fichero `backend/.env`)
```env
HENRIK_API_KEY=   # Clave de api.henrikdev.xyz (acceso a datos de Valorant)
OPENAI_API_KEY=   # Clave de platform.openai.com
DATABASE_URL=     # URL de PostgreSQL (en local: postgresql://valocoach:supersecretpassword@localhost:5433/valocoach_db)
REDIS_URL=        # URL de Redis (en local: redis://localhost:6379/0)
```

### 4.3 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Health check — devuelve `{"mensaje": "¡Servidor de ValoCoach activado y listo!"}` |
| `GET` | `/api/v1/player/{name}/{tag}` | Datos básicos del jugador + rango actual |
| `GET` | `/api/v1/coach/{name}/{tag}` | **Endpoint principal** — historial + métricas + análisis IA |

### 4.4 Lógica del Endpoint Principal `/api/v1/coach/{name}/{tag}`

1. **Comprueba Redis** con la clave `coach:{name.lower()}:{tag.lower()}`.
2. **Cache Hit** → Devuelve el JSON almacenado directamente (TTL: 15 minutos).
3. **Cache Miss** → Flujo completo:
   - Obtiene cuenta con `valo_api.get_account_details_by_name(v1)`
   - Obtiene rango con `valo_api.get_mmr_details_by_name(v2)` (tolera fallo si Unranked)
   - Obtiene partidas con `valo_api.get_match_history_by_name_v3(size=3)`
   - Busca al jugador en cada partida por `name.lower()` + `tag.lower()`
   - Construye el prompt para OpenAI con mapas, agentes, KDA, resultado
   - Llama a `gpt-4o-mini` (max_tokens=300, temperature=0.7)
   - Guarda en PostgreSQL (modelo `CoachAdvice`)
   - Cachea en Redis con `setex(cache_key, 900, json.dumps(response_data))`
   - Devuelve JSON enriquecido al Frontend

### 4.5 Estructura del JSON de respuesta
```json
{
  "status": "success",
  "data": {
    "player": { "name", "tag", "region", "account_level", "card_image" },
    "rank": { "current_rank", "elo", "mmr_change_last_game" },
    "matches": [
      { "map", "agent", "kills", "deaths", "assists", "score", "result": "Ganada" | "Perdida" }
    ],
    "coach_advice": "string con el análisis en Markdown de OpenAI"
  }
}
```

### 4.6 Modelo de Base de Datos (PostgreSQL)

**Tabla: `coach_advices`**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | Integer PK | Auto-incremental |
| `player_id` | String | Identificador `Nombre#TAG` |
| `advice_text` | String | Texto del análisis de la IA |
| `matches_data` | JSON | Resumen en texto de las partidas usadas |
| `created_at` | DateTime | Timestamp de creación (UTC) |

### 4.7 Reglas de Código Obligatorias
- **PROHIBIDO** usar `print()`. Toda traza debe hacerse con el logger.
- Usar siempre `from app.logger import get_logger` y `logger = get_logger(__name__)`.
- Niveles: `logger.info()` para eventos de flujo, `logger.debug()` para detalles técnicos, `logger.error(..., exc_info=True)` para excepciones.

### 4.8 Fix aplicado (Bug de valo-api con espacios en nombres)
```python
# En main.py línea 21 — CRÍTICO, no eliminar
valo_api.utils.fetch_endpoint.urllib.parse.quote_plus = urllib.parse.quote
```
Sin este parche, los nombres de jugador con espacios fallan porque `valo-api` codifica espacios como `+` en lugar de `%20`.

---

## 5. Frontend (Next.js — React)

### 5.1 Stack y Dependencias
```json
"next": "16.2.10"       → App Router, Server Components
"react": "19.2.4"       → Con useTransition y use() para Promises
"recharts": "^3.9.2"    → Gráficos interactivos (PieChart, LineChart)
"lucide-react": "^1.25.0" → Iconografía
"tailwindcss": "^4"     → Sistema de estilos (v4, sin config.js)
"framer-motion": "^12"  → Librería de animaciones (instalada, disponible)
"clsx" + "tailwind-merge" → Utilidades de clases CSS
```

### 5.2 Variable de Entorno requerida (fichero `frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
En producción (Vercel), esta variable está configurada con el valor:
`https://valocoach-ai-h4ss.onrender.com`

### 5.3 Páginas

**`/` (Home — `page.tsx`)**
- Formulario con 2 campos: `Riot ID` y `TAG`.
- Al enviar, redirige a `/coach/[name]/[tag]` con `encodeURIComponent` en ambos valores.
- Elementos decorativos: dos orbes con blur en fondo (red/blue).
- Indicador de estado: punto verde animado "Sistemas Operativos".

**`/coach/[name]/[tag]` (Dashboard — `coach/[name]/[tag]/page.tsx`)**
- Desenvuelve `params` como Promise con React 19 `use()`.
- Hace `fetch` al backend durante el renderizado con `useEffect`.
- 3 estados: Loading (con `BrainCircuit` animado), Error, y Dashboard completo.
- **Layout:** Grid de 3 columnas (1 izquierda + 2 derecha) en desktop, 1 columna en móvil.
  - **Columna Izquierda:** Tarjeta del jugador (card_image + nivel + rango + elo), Historial de 3 partidas, Donut Chart Winrate.
  - **Columna Derecha:** Line Chart KDA Ratio, Panel de análisis de la IA con Markdown parseado a mano.

### 5.4 Sistema de Diseño (Design System)

Definido en `globals.css` con CSS Custom Properties bajo `@theme` (Tailwind v4):

```css
/* Colores corporativos */
--color-background: #09090b;    /* Fondo principal, casi negro */
--color-foreground: #fafafa;    /* Texto principal */
--color-card: #121214;          /* Fondo de tarjetas */
--color-card-border: #27272a;   /* Bordes sutiles */
--color-primary: #ff4655;       /* Valorant Red — usar con moderación */
--color-primary-hover: #ff5866;
--color-muted: #27272a;
--color-muted-foreground: #a1a1aa; /* Texto secundario */
```

**Clase reutilizable:**
```css
.glass-panel {
  background: rgba(18, 18, 20, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}
```
**Efecto de fondo global:** `radial-gradient` rojo muy sutil en la parte superior de cada página.

---

## 6. Infraestructura y Despliegue

### 6.1 Entorno Local

Levantar en este orden (3 terminales abiertas en la raíz del proyecto):

```bash
# Terminal 1 — Infraestructura (DB + Caché)
docker-compose up -d

# Terminal 2 — Backend Python (Puerto 8000)
cd backend
.\venv\Scripts\activate   # En Windows
uvicorn app.main:app --reload

# Terminal 3 — Frontend Next.js (Puerto 3001)
cd frontend
npm run dev

# Acceder en: http://localhost:3001
```

> ⚠️ **Nota Windows:** PostgreSQL corre en el puerto `5433` (no 5432 estándar) para evitar conflictos con instalaciones locales de Postgres. Redis sí usa el 6379 estándar.

> ⚠️ **Nota Windows:** Grafana usa el puerto 3000, por eso el frontend corre en 3001.

### 6.2 Entorno Producción (La Nube)

| Servicio | Plataforma | Detalles |
|---------|-----------|---------|
| **Frontend** | Vercel | Root Directory: `frontend`. Auto-deploy en push a `main`. |
| **Backend (API)** | Render (Web Service Docker) | Root Directory: `backend`. Dockerfile detectado automáticamente. Puerto 8000. |
| **PostgreSQL** | Render (PostgreSQL Managed) | Plan Free. Región: Frankfurt (EU Central). |
| **Redis** | Render (Key Value) | Plan Free. Región: Frankfurt (EU Central). Política: `allkeys-lru`. |

**Variables de entorno en Render (Backend Web Service):**
```
HENRIK_API_KEY     → Clave de HenrikDev API
OPENAI_API_KEY     → Clave de OpenAI
DATABASE_URL       → Internal URL del PostgreSQL de Render
REDIS_URL          → Internal URL del Key-Value de Render
```

**Flujo de CI/CD:**
- `git push origin main` → Vercel detecta el cambio y despliega el frontend automáticamente.
- Para el backend: ir a Render > Web Service > botón "Manual Deploy" (o configurar Auto-Deploy).

---

## 7. Bugs Conocidos y Resoluciones

| Bug | Causa | Solución Aplicada |
|-----|-------|------------------|
| `UnicodeDecodeError` de psycopg2 en Windows | Conflicto de encoding del sistema operativo | Puerto cambiado a 5433 y manejo con try/except en `create_all()` |
| `TypeError: cannot read property 'map' of undefined` | Redis cacheaba el JSON con el esquema antiguo tras actualizar la respuesta del backend | Ejecutar `REDIS FLUSHALL` para limpiar la caché |
| Git submodule en `frontend/` | `create-next-app` generó su propio `.git` | `git rm --cached frontend -f` + `Remove-Item -Recurse -Force frontend\.git` |
| `Failed to fetch` en Vercel | CORS del backend solo permitía `localhost`. La variable `NEXT_PUBLIC_API_URL` puede compilarse vacía si Vercel no la tiene en el momento del build | Configurado `allow_origins=["*"]` en FastAPI. Forzar "Redeploy" en Vercel si persiste |
| `&&` en PowerShell | PowerShell no soporta `&&` como separador de comandos | Usar `;` en su lugar: `git add . ; git commit -m "msg" ; git push` |
| `HEAD /` devuelve `405 Method Not Allowed` | Render hace un "HEAD" request al health check, pero FastAPI solo tiene `GET /` definido | Normal, no es un error crítico. El backend inicia correctamente igualmente |

---

## 8. Próximos Pasos Potenciales (Hoja de Ruta)

*Estas funcionalidades están identificadas pero NO implementadas aún en la Beta:*

- **Más métricas Tier 1:** HS% (porcentaje de headshots), Economy Rating, First Blood Rate.
- **Soporte de más partidas:** Aumentar el historial de 3 a 10 o 20 partidas para análisis más precisos.
- **Historial del usuario:** Página donde el jugador vea todos sus análisis anteriores (ya existe la tabla en BBDD).
- **Sistema de login:** Integración con Riot SSO para autenticar y guardar el perfil.
- **Modo Pro:** Comparativa entre jugadores, análisis de equipo.
- **Custom Domain:** Asociar un dominio propio (`valocoach.gg` o similar) en Vercel.

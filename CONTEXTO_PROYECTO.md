# Contexto del Proyecto: ValoCoach AI (MVP 1.0)

Este documento es una guía definitiva que sirve como **Contexto Integral** del proyecto. Está diseñado para que cualquier IA o desarrollador que se una al proyecto pueda leerlo y entender al 100% la arquitectura, decisiones de diseño, stack tecnológico e integraciones de ValoCoach AI.

---

## 1. Descripción General del Producto
**ValoCoach AI** es una plataforma SaaS Full-Stack dirigida a jugadores de Valorant. 
Su objetivo es consultar el historial de partidas del usuario, analizar sus métricas de impacto reales (como el KDA Ratio) y utilizar un LLM (OpenAI) para proporcionar un "Coaching Táctico" personalizado. Emula el análisis exhaustivo de un Coach de eSports de Tier 1.

---

## 2. Arquitectura del Sistema
El proyecto sigue una arquitectura clásica cliente-servidor desacoplada, con un backend robusto basado en microservicios (API, DB, Caché) y un frontend altamente reactivo.

### 2.1 Backend ("El Cerebro y La Memoria")
Ubicado en la carpeta `/backend`.
- **Core:** Python 3.11 con **FastAPI**.
- **Integración API Valorant:** Utiliza la librería oficial no-oficial `henrikdev/Valorant-API` (v1 para cuenta, v2 para MMR, v3 para historial de partidas).
- **Inteligencia Artificial:** OpenAI API (`gpt-4o-mini`). Recibe un prompt estructurado con las últimas 3 partidas extraídas (Mapa, Agente, Resultado, KDA y Puntuación) y devuelve un análisis en formato Markdown.
- **Base de Datos (Persistencia):** PostgreSQL + SQLAlchemy. Guarda un registro de todas las consultas realizadas en el modelo `CoachAdvice`.
- **Caché (Velocidad):** Redis. Todas las peticiones completas se guardan como un JSON enriquecido en Redis con un Time-To-Live (TTL) de 900 segundos (15 minutos). Esto evita agotar los límites de la API de Henrik o de OpenAI en caso de spam.
- **Regla Estricta del Proyecto:** El uso de `print()` está prohibido. Todo el logging se hace mediante un módulo profesional personalizado (`app/logger.py`) para capturar eventos y errores.

### 2.2 Frontend ("La Cara")
Ubicado en la carpeta `/frontend`.
- **Core:** **Next.js 16.2** (App Router) con React 19.
- **Estilos:** Tailwind CSS v4.
- **Diseño Visual (UI/UX):** 
  - Estética **"Premium Dark Mode Corporativo"**. Fondo principal gris muy oscuro (`#09090b`) en lugar de negro plano.
  - Efectos de **Glassmorphism** (tarjetas translúcidas con blur y bordes iluminados sutiles).
  - Tipografía profesional `Inter`.
  - Colores corporativos: Gris carbón para estructura, Blanco puro para texto destacado, verde para victorias, y acentos de color *Valorant Red* (`#ff4655`) para botones y derrotas.
- **Visualización de Datos (Tier 1 Metrics):** Utiliza la librería `recharts` para transformar los números en bruto del backend en gráficos impactantes:
  - *Winrate (Donut Chart):* Distribución de Victorias vs Derrotas.
  - *Impact KDA Ratio (Line Chart):* Ratio de impacto `(Kills + Assists) / Deaths` trazado a lo largo del tiempo, con Tooltips interactivos que muestran el mapa y el agente jugado.
- **Iconografía:** `lucide-react`.

---

## 3. Flujo de Datos (User Journey)
1. **Búsqueda:** El usuario entra a la web e introduce su `Riot ID` y `TAG`. Next.js redirige dinámicamente a la ruta `/coach/[name]/[tag]`.
2. **Petición Fetch:** El Frontend hace un GET a la variable de entorno `NEXT_PUBLIC_API_URL` (hacia `/api/v1/coach/{name}/{tag}`).
3. **Comprobación de Caché:** El Backend de FastAPI busca esa clave en Redis. Si existe (Cache Hit), devuelve el JSON instantáneamente.
4. **Análisis (Cache Miss):** Si no existe, FastAPI contacta a Henrik API, extrae las 3 últimas partidas, busca al usuario en esas partidas, calcula resultados, y manda un prompt a OpenAI.
5. **Guardado y Respuesta:** FastAPI guarda el consejo de la IA en PostgreSQL, almacena el JSON enriquecido en Redis y se lo devuelve a Next.js.
6. **Renderizado:** Next.js dibuja el Dashboard corporativo con el Markdown parseado y anima los gráficos de `recharts`.

---

## 4. Despliegue (DevOps)

### 4.1 Entorno Local
- Se utiliza `docker-compose.yml` en la raíz del proyecto para levantar los contenedores de **PostgreSQL** (puerto 5433 para evitar conflictos en Windows) y **Redis** (puerto 6379).
- Se ejecuta el backend con `uvicorn` desde un entorno virtual.
- Se ejecuta el frontend con `npm run dev` en el puerto `3001` con una variable `.env.local` que apunta a localhost.

### 4.2 Entorno Producción (La Nube)
- **Backend + Infraestructura:** Alojado en **Render.com**. 
  - Base de datos nativa en Render (PostgreSQL).
  - Caché nativa en Render (Key-Value / Redis).
  - Web Service de Docker (`backend/Dockerfile`) exponiendo el puerto `8000`.
- **Frontend:** Alojado en **Vercel**. 
  - Conectado directamente a la rama `main` de GitHub. 
  - El *Root Directory* de Vercel está seteado explícitamente en `frontend`.
  - La variable `NEXT_PUBLIC_API_URL` apunta a la URL pública del backend de Render.

---

## 5. Decisiones Técnicas y Resoluciones de Bugs
- **UnicodeDecodeError de psycopg2 en Windows:** Solucionado encapsulando la creación de tablas `models.Base.metadata.create_all(bind=engine)` en bloques `try-except` y moviendo el puerto de Postgres del 5432 habitual al 5433 en el entorno local.
- **Error TypeError (map) del Caché Frontend:** Ocurrió al actualizar la estructura del JSON del Backend para añadir las listas de métricas, ya que Redis seguía enviando el esquema antiguo de memoria. Solucionado con un comando `FLUSHALL` en Redis.
- **Git Submodules en Next.js:** Al crear el proyecto de Next.js, se generó un repositorio embebido que ocultaba la carpeta a GitHub. Solucionado ejecutando `git rm --cached frontend -f` y eliminando la subcarpeta `.git` del frontend antes de hacer commit.

---

Este contexto debe ser suministrado a cualquier nueva instancia de IA para que pueda continuar desarrollando ValoCoach AI sin romper la arquitectura, el diseño o la lógica empresarial establecida en el MVP 1.0.

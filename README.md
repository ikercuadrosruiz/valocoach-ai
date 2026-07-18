<div align="center">
  <img src="https://media.valorant-api.com/competitivetiers/03621f52-3424-cf33-0469-25a6a5b28ce2/24/largeicon.png" width="100" />
  <h1>ValoCoach AI</h1>
  <p><strong>Tu Analista de eSports Impulsado por Inteligencia Artificial</strong></p>
</div>

ValoCoach AI es una plataforma *Full-Stack* diseñada para jugadores de Valorant que buscan mejorar su rendimiento. Extrae tus partidas en tiempo real y utiliza la potencia de **GPT-4o-mini** para darte un análisis táctico digno de un Coach Tier 1, acompañado de métricas y gráficos visuales corporativos.

---

## 🚀 Características Principales

- 🤖 **Coach por IA**: Análisis táctico, detección de puntos débiles y metas accionables personalizadas.
- 📊 **Métricas Tier 1**: Visualización de KDA Ratios y Winrates recientes usando gráficos interactivos (Recharts).
- ⚡ **Ultra Rápido**: Sistema de caché con Redis para respuestas en milisegundos.
- 🎨 **Diseño Premium**: Interfaz corporativa con estética Dark Mode y Glassmorphism.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js (React 19), Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Python, FastAPI, SQLAlchemy, Henrik API (Valorant).
- **Infraestructura**: PostgreSQL, Redis, Docker.
- **Inteligencia Artificial**: OpenAI API.

## 💻 Instalación y Despliegue Local

Para levantar el proyecto completo en tu ordenador, abre tres terminales distintas en la raíz del proyecto y ejecuta:

### 1. Levantar la Infraestructura (Base de datos y Caché)
```bash
docker-compose up -d
```

### 2. Levantar el Backend (API Python)
Asegúrate de crear un archivo `.env` en la carpeta `/backend` con tus `HENRIK_API_KEY` y `OPENAI_API_KEY`.
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```
*La API estará escuchando en `http://localhost:8000`*

### 3. Levantar el Frontend (Web App)
```bash
cd frontend
npm run dev
```
*El portal del jugador estará en `http://localhost:3001`*

---

> Creado con precisión y pasión para jugadores que buscan el Radiant. 🎯

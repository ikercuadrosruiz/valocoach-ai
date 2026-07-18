# Comandos Rápidos ValoCoach AI

Abre 3 terminales en la raíz del proyecto y ejecuta los siguientes pasos para levantar todo el sistema:

### 1. Base de datos e Infraestructura
Inicia los contenedores de PostgreSQL (historial) y Redis (caché) en segundo plano.
```bash
docker-compose up -d
```

### 2. Backend (Puerto 8000)
Entra a la carpeta de Python, activa el entorno virtual y levanta la API de FastAPI.
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

### 3. Frontend (Puerto 3001)
Entra a la carpeta de Next.js y arranca la interfaz visual para el usuario final.
```bash
cd frontend
npm run dev
```

Acceder a la url: http://localhost:3001
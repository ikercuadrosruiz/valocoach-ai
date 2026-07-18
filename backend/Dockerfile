FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de dependencias
COPY requirements.txt .

# Instalar las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto que usará Render/Railway (por defecto 8000)
EXPOSE 8000

# Comando para ejecutar la aplicación en producción
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

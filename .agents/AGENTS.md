# Reglas del Proyecto ValoCoach AI

## Logging Profesional
- **Uso Obligatorio de Logs**: Es un requisito indispensable para todo el código nuevo. No uses sentencias `print()` en producción ni en los microservicios principales.
- **Implementación**: Usa siempre el módulo preconfigurado de logging del proyecto (ej. `from app.logger import get_logger`).
- **Niveles de Log**:
  - Usa `logger.info()` para eventos importantes del flujo (ej. "Petición recibida", "Conexión a DB exitosa", "Llamada a OpenAI completada").
  - Usa `logger.debug()` para detalles técnicos granulares y trazas de estado (ej. "Extrayendo MMR del jugador X", "Enviando payload Y").
  - Usa `logger.error()` o `logger.warning()` para capturar excepciones con contexto claro y `exc_info=True` si es necesario.

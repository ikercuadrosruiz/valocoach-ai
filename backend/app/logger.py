import logging
import sys

def get_logger(name: str):
    logger = logging.getLogger(name)
    
    # Evitar añadir múltiples handlers si el logger ya existe
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Formato profesional: Fecha/Hora | Nivel | Archivo | Mensaje
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
        # Handler para consola
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
    return logger

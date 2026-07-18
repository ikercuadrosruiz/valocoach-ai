import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import valo_api
import urllib.parse
import valo_api.utils.fetch_endpoint
import openai
import json

# Importaciones de la base de datos
from .database import get_db, redis_client, engine
from . import models
from .logger import get_logger

logger = get_logger(__name__)

# Parche para el bug de valo_api con los espacios en el nombre (usa + en lugar de %20)
valo_api.utils.fetch_endpoint.urllib.parse.quote_plus = urllib.parse.quote
# 1. Cargar las variables secretas del archivo .env
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Configurar la clave en la librería de Valorant
VALORANT_KEY = os.getenv('HENRIK_API_KEY')
valo_api.set_api_key(VALORANT_KEY)

# Inicializar las tablas de la base de datos
try:
    logger.info("Verificando/Creando tablas en la base de datos PostgreSQL...")
    models.Base.metadata.create_all(bind=engine)
    logger.info("Tablas verificadas correctamente.")
except Exception as e:
    logger.error(f"Advertencia al crear tablas: {e}")

# 3. Inicializar el servidor
logger.info("Inicializando FastAPI App...")
app = FastAPI(title = 'ValoCoach AI')

# Configuración de CORS para permitir que el frontend (Next.js) acceda al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def read_root():
    return {'mensaje' : '¡Servidor de ValoCoach activado y listo!'}

@app.get('/api/v1/player/{name}/{tag}')
def get_player(name: str, tag: str):
    """
    Obtiene los detalles de la cuenta y el rango actual de un jugador.
    """
    logger.info(f"Petición recibida en /api/v1/player para {name}#{tag}")
    try:
        # Obtener información de la cuenta (nivel, región, etc.)
        logger.debug(f"Obteniendo account details para {name}#{tag}...")
        account = valo_api.get_account_details_by_name(version="v1", name=name, tag=tag)
        
        # Obtener información de MMR (rango, elo) usando la región de la cuenta
        logger.debug(f"Obteniendo MMR details para {name}#{tag} en región {account.region}...")
        mmr = valo_api.get_mmr_details_by_name(version="v2", region=account.region, name=name, tag=tag)
        
        # Estructurar la respuesta en JSON limpio
        logger.info(f"Datos del jugador {name}#{tag} obtenidos con éxito. Rango: {mmr.current_data.currenttierpatched}")
        return {
            "status": "success",
            "data": {
                "player": {
                    "name": account.name,
                    "tag": account.tag,
                    "region": account.region,
                    "account_level": account.account_level,
                    "card_image": account.card.small if account.card else None
                },
                "rank": {
                    "current_rank": mmr.current_data.currenttierpatched,
                    "elo": mmr.current_data.elo,
                    "mmr_change_last_game": mmr.current_data.mmr_change_to_last_game
                }
            }
        }
    except Exception as e:
        # Manejo básico de errores (ej. jugador no encontrado, API caída)
        logger.error(f"Error en get_player para {name}#{tag}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Error al obtener los datos del jugador: {str(e)}")

@app.get('/api/v1/coach/{name}/{tag}')
def get_coach_advice(name: str, tag: str, db: Session = Depends(get_db)):
    """
    Obtiene las últimas partidas del jugador, las resume y le pide a OpenAI un consejo táctico.
    Utiliza Redis para caché y PostgreSQL para guardar el histórico.
    """
    logger.info(f"Petición de Coach recibida para {name}#{tag}")
    cache_key = f"coach:{name.lower()}:{tag.lower()}"
    
    # 1. Comprobar en Redis si ya tenemos un consejo reciente (15 minutos)
    cached_response = redis_client.get(cache_key)
    if cached_response:
        logger.info(f"CACHE HIT: Devolviendo consejo desde Redis para {name}#{tag}")
        return json.loads(cached_response)

    logger.info(f"CACHE MISS: Iniciando análisis completo para {name}#{tag}")
    try:
        # 2. Obtener detalles básicos
        account = valo_api.get_account_details_by_name(version="v1", name=name, tag=tag)
        
        # Intentar obtener MMR (ignoramos si falla por ser Unranked)
        current_rank = "Unranked"
        try:
            mmr = valo_api.get_mmr_details_by_name(version="v2", region=account.region, name=name, tag=tag)
            current_rank = mmr.current_data.currenttierpatched
        except Exception:
            logger.warning(f"No se pudo obtener el MMR de {name}#{tag}. Se asume 'Unranked'.")
            pass

        # 3. Obtener historial de partidas (últimas 3 partidas)
        logger.debug(f"Obteniendo últimas 3 partidas para {name}#{tag}...")
        matches = valo_api.get_match_history_by_name_v3(account.region, name, tag, size=3)
        
        match_summaries = []
        frontend_matches = []
        for m in matches:
            # Buscar al jugador en la partida
            player_data = next((p for p in m.players.all_players if p.name.lower() == name.lower() and p.tag.lower() == tag.lower()), None)
            if not player_data:
                continue
            
            # Determinar si ganó
            won = m.teams.red.has_won if player_data.team.lower() == "red" else m.teams.blue.has_won
            resultado = "Victoria" if won else "Derrota"
            
            summary = (
                f"- Mapa: {m.metadata.map}\n"
                f"  Agente: {player_data.character}\n"
                f"  Resultado: {resultado}\n"
                f"  KDA: {player_data.stats.kills}/{player_data.stats.deaths}/{player_data.stats.assists}\n"
                f"  Puntuación de combate: {player_data.stats.score}"
            )
            match_summaries.append(summary)
            
            frontend_matches.append({
                "map": m.metadata.map,
                "agent": player_data.character,
                "kills": player_data.stats.kills,
                "deaths": player_data.stats.deaths,
                "assists": player_data.stats.assists,
                "score": player_data.stats.score,
                "result": "Ganada" if won else "Perdida"
            })

        matches_text = "\n".join(match_summaries)

        # 4. Preparar el prompt para el LLM
        system_prompt = (
            "Eres ValoCoach, un analista táctico profesional de Valorant. "
            "Tu objetivo es dar un consejo corto, directo y accionable a un jugador basándote en sus últimas partidas. "
            "No seas genérico, menciona sus agentes, mapas y KDA. Sé motivador pero crítico."
        )
        
        user_prompt = (
            f"El jugador {name}#{tag} tiene rango {current_rank}. "
            f"Aquí están sus últimas 3 partidas:\n{matches_text}\n\n"
            "Dime un diagnóstico de sus puntos débiles y 2 metas claras para su próxima sesión."
        )

        # 5. Llamar a OpenAI
        logger.info("Enviando datos a OpenAI GPT-4o-mini para generar diagnóstico...")
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )

        coach_advice = response.choices[0].message.content
        logger.info("Respuesta de OpenAI recibida con éxito.")

        # Obtener datos de MMR seguros
        elo = 0
        mmr_change = 0
        if current_rank != "Unranked":
            try:
                elo = mmr.current_data.elo
                mmr_change = mmr.current_data.mmr_change_to_last_game
            except:
                pass

        response_data = {
            "status": "success",
            "data": {
                "player": {
                    "name": account.name,
                    "tag": account.tag,
                    "region": account.region,
                    "account_level": account.account_level,
                    "card_image": account.card.small if account.card else None
                },
                "rank": {
                    "current_rank": current_rank,
                    "elo": elo,
                    "mmr_change_last_game": mmr_change
                },
                "matches": frontend_matches,
                "coach_advice": coach_advice
            }
        }

        # 6. Guardar en PostgreSQL
        logger.debug("Guardando consejo en base de datos PostgreSQL...")
        new_advice = models.CoachAdvice(
            player_id=f"{name}#{tag}",
            advice_text=coach_advice,
            matches_data=match_summaries
        )
        db.add(new_advice)
        db.commit()

        # 7. Guardar en Redis con expiración de 15 minutos (900 segundos)
        logger.debug("Guardando respuesta en caché Redis (TTL 15 min)...")
        redis_client.setex(cache_key, 900, json.dumps(response_data))

        logger.info(f"Análisis completado exitosamente para {name}#{tag}")
        return response_data
    except Exception as e:
        logger.error(f"Error fatal en get_coach_advice para {name}#{tag}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error en ValoCoach: {str(e)}")

# Fin del archivo main.py
# Reloading again...
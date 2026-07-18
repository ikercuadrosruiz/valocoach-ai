from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from .database import Base

class CoachAdvice(Base):
    __tablename__ = "coach_advices"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(String, index=True) # Nombre#TAG
    advice_text = Column(String)
    matches_data = Column(JSON) # Datos crudos o resumen que se usó para el consejo
    created_at = Column(DateTime, default=datetime.utcnow)

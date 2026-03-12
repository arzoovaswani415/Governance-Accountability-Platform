from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Sector
from app.schemas import SectorOut

router = APIRouter()


@router.get("/", response_model=list[SectorOut])
def list_sectors(db: Session = Depends(get_db)):
    """List available sectors from the database."""
    return db.query(Sector).order_by(Sector.name.asc()).all()


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.watchlist import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse
from app.ai.plate_validator import normalize_plate_text

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("", response_model=List[WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(Watchlist).order_by(Watchlist.created_at.desc()).all()

@router.post("", response_model=WatchlistResponse)
def add_to_watchlist(item_in: WatchlistCreate, db: Session = Depends(get_db)):
    clean_plate = normalize_plate_text(item_in.plate_number)
    existing = db.query(Watchlist).filter(Watchlist.plate_number == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle is already in the watchlist")

    wl = Watchlist(
        plate_number=clean_plate,
        reason=item_in.reason,
        priority=item_in.priority,
        status=item_in.status,
        added_by="Admin"
    )
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return wl

@router.delete("/{watchlist_id}")
def remove_from_watchlist(watchlist_id: int, db: Session = Depends(get_db)):
    item = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")

    db.delete(item)
    db.commit()
    return {"message": "Watchlist entry removed successfully"}

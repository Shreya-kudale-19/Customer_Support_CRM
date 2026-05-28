from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db

# Create all database tables on startup. 
# Note: In production systems, migration tools like Alembic are preferred.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support Ticketing CRM",
    description="Assessment Project API for managing customer support tickets.",
    version="1.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
# This is crucial for local development if the frontend is run on a different port than the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# ----------------- API ENDPOINTS -----------------

@app.post("/api/tickets", response_model=schemas.TicketCreateResponse, status_code=status.HTTP_201_CREATED)
def create_new_ticket(ticket_in: schemas.TicketCreate, db: Session = Depends(get_db)):
    """
    Creates a new support ticket in the CRM.
    Returns the auto-generated ticket ID (e.g. TKT-001) and creation timestamp.
    """
    db_ticket = crud.create_ticket(db, ticket_in)
    return db_ticket


@app.get("/api/tickets", response_model=List[schemas.TicketShortResponse])
def read_all_tickets(
    status: Optional[str] = Query(None, description="Filter tickets by status (Open, In Progress, Closed)"),
    search: Optional[str] = Query(None, description="Search term across name, email, subject, description, and ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves a list of all tickets. Supports optional search and status filtering.
    """
    return crud.get_tickets(db, status=status, search=search)


@app.get("/api/tickets/{ticket_id}", response_model=schemas.TicketDetailResponse)
def read_ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the complete details of a specific ticket, including its full history of notes.
    """
    db_ticket = crud.get_ticket_by_ticket_id(db, ticket_id)
    if not db_ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found."
        )
    return db_ticket


@app.put("/api/tickets/{ticket_id}")
def update_ticket_status_and_notes(
    ticket_id: str,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates a ticket's status and/or appends a new comment/note.
    """
    db_ticket = crud.get_ticket_by_ticket_id(db, ticket_id)
    if not db_ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found."
        )
        
    crud.update_ticket(db, db_ticket, ticket_update)
    return {
        "success": True,
        "updated_at": datetime()
    }


# ----------------- SERVING FRONTEND -----------------

# Ensure the static directory exists before mounting to avoid errors
os.makedirs("static", exist_ok=True)

# Mount the static directory so FastAPI serves index.html and client assets
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_homepage():
    """
    Serves the main single-page application from index.html.
    """
    # Return index.html from static folder
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Welcome to the Support Ticketing API! (Frontend files are being set up next)"
    }

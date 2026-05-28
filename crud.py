from datetime import datetime
from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
import schemas

def generate_next_ticket_id(db: Session) -> str:
    """
    Generates a unique, sequential ticket ID (e.g., TKT-001, TKT-002).
    This queries the database for the maximum internal integer ID and increments it,
    which is robust against deletes (prevents generating duplicate IDs).
    """
    max_id_row = db.query(models.Ticket.id).order_by(models.Ticket.id.desc()).first()
    next_num = (max_id_row[0] + 1) if max_id_row else 1
    return f"TKT-{next_num:03d}"


def get_tickets(db: Session, status: Optional[str] = None, search: Optional[str] = None):
    """
    Queries all tickets with optional status filtering and flexible search.
    Searches across ticket ID, customer name, email, subject, and description.
    """
    query = db.query(models.Ticket)
    
    # 1. Apply status filter if provided
    if status:
        query = query.filter(models.Ticket.status == status)
        
    # 2. Apply text search if provided (case-insensitive search)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.ticket_id.ilike(search_term),
                models.Ticket.customer_name.ilike(search_term),
                models.Ticket.customer_email.ilike(search_term),
                models.Ticket.subject.ilike(search_term),
                models.Ticket.description.ilike(search_term)
            )
        )
        
    # Order by newest tickets first
    return query.order_by(models.Ticket.created_at.desc()).all()


def get_ticket_by_ticket_id(db: Session, ticket_id: str) -> Optional[models.Ticket]:
    """
    Retrieves a single ticket by its string business ID (e.g., TKT-005).
    """
    return db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()


def create_ticket(db: Session, ticket_in: schemas.TicketCreate) -> models.Ticket:
    """
    Creates a new ticket and generates its sequential ticket_id.
    """
    next_ticket_id = generate_next_ticket_id(db)
    
    db_ticket = models.Ticket(
        ticket_id=next_ticket_id,
        customer_name=ticket_in.customer_name,
        customer_email=ticket_in.customer_email,
        subject=ticket_in.subject,
        description=ticket_in.description,
        status="Open" # Starts in 'Open' state
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def update_ticket(db: Session, db_ticket: models.Ticket, ticket_update: schemas.TicketUpdate) -> models.Ticket:
    """
    Updates ticket fields.
    - If status is provided, it updates the ticket status and sets updated_at.
    - If notes (comment text) is provided, it appends a new Note record to the notes table.
    """
    # 1. Update status if provided in request
    if ticket_update.status:
        db_ticket.status = ticket_update.status
        db_ticket.updated_at = datetime.utcnow()
        
    # 2. Add note if a comment text was provided
    if ticket_update.notes:
        db_note = models.Note(
            ticket_id=db_ticket.ticket_id,
            note_text=ticket_update.notes
        )
        db.add(db_note)
        
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

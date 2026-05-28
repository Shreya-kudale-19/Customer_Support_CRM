from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    
    # Custom business ticket ID (e.g., TKT-001) that is unique and searchable
    ticket_id = Column(String, unique=True, index=True, nullable=False)
    
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    # Status constrained to "Open", "In Progress", or "Closed"
    status = Column(String, default="Open", nullable=False)
    
    # Timestamps for tracking ticket lifecycle
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Establish one-to-many relationship with the Note table.
    # cascade="all, delete-orphan" ensures notes are deleted if their ticket is deleted.
    notes = relationship("Note", back_populates="ticket", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key referencing the ticket_id of the tickets table
    ticket_id = Column(String, ForeignKey("tickets.ticket_id"), nullable=False)
    
    note_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Back-reference relationship to the Ticket class
    ticket = relationship("Ticket", back_populates="notes")

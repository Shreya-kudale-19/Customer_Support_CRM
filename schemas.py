from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr

# Note Schemas
class NoteBase(BaseModel):
    note_text: str

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    ticket_id: str
    created_at: datetime

    # ConfigDict(from_attributes=True) allows Pydantic to read SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)


# Ticket Schemas
class TicketBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=100)
    customer_email: str = Field(..., min_length=3, max_length=100) # Plain str validation for simplicity, or EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)

class TicketCreate(TicketBase):
    pass

# Response for POST /api/tickets
class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Item for GET /api/tickets (list view)
class TicketShortResponse(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Response for GET /api/tickets/{ticket_id} (detailed view with notes list)
class TicketDetailResponse(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: List[NoteResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Request for PUT /api/tickets/{ticket_id} (update status and/or add a note)
class TicketUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Open|In Progress|Closed)$")
    notes: Optional[str] = None # Text for a new note to be appended

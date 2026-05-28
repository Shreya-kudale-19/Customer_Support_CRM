# SupportFlow CRM — Customer Support Ticketing System

A high-performance, modern, and visually stunning Customer Support Ticketing CRM System. This application is structured as an assessment project, featuring a powerful backend API built with **Python + FastAPI**, an **SQLite** database managed via **SQLAlchemy ORM**, and a premium dark-themed frontend single-page application (SPA) with real-time analytics.

---

## 🚀 Key Features

1. **Dashboard Analytics**: Real-time aggregated ticket counts (Total, Open, In Progress, Closed) to monitor workload.
2. **Create Ticket**: Dynamic input validation for customer name, email, subject, and description. Generates thread-safe sequential IDs (e.g. `TKT-001`).
3. **Flexible Search & Filtering**: Real-time filtering by ticket status and instant case-insensitive search across customer names, emails, subjects, descriptions, and IDs.
4. **Slide-over Timeline Drawer**: An interactive panel displaying details for specific support tickets, including status select triggers and a chronological activity/comments feed.
5. **Robust Security**: Complete sanitization of inputs to prevent **Cross-Site Scripting (XSS)** attacks, and pre-packaged **CORS** middleware.

---

## 🛠️ Technology Stack

* **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI server for elite performance and automatic interactive Swagger documentation).
* **Database**: [SQLite](https://sqlite.org/) (Embedded file-based database requiring zero complex configurations).
* **ORM Toolkit**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Maps database models directly to Python objects with built-in protection against SQL injections).
* **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) (Strict type-checking and automated data translation).
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Modern layout engine utilizing a customized dark palette).
* **Logic / Frontend Engine**: Vanilla ES6 JavaScript (Lightweight SPA state handling, debounced keystroke listeners, and asynchronous REST interactions).

---

## 🔌 API Reference

### 1. Create Ticket
* **Endpoint**: `POST /api/tickets`
* **Request Body**:
  ```json
  {
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Unable to access billing tab",
    "description": "Getting a 403 Forbidden error message when clicking billing."
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "ticket_id": "TKT-001",
    "created_at": "2026-05-27T18:20:00Z"
  }
  ```

### 2. List All Tickets
* **Endpoint**: `GET /api/tickets`
* **Query Parameters (Optional)**:
  * `status`: Filter by `Open`, `In Progress`, or `Closed`
  * `search`: Search query string
* **Response**: `200 OK`
  ```json
  [
    {
      "ticket_id": "TKT-001",
      "customer_name": "Jane Doe",
      "subject": "Unable to access billing tab",
      "status": "Open",
      "created_at": "2026-05-27T18:20:00Z"
    }
  ]
  ```

### 3. Retrieve Ticket Detail
* **Endpoint**: `GET /api/tickets/{ticket_id}`
* **Response**: `200 OK`
  ```json
  {
    "ticket_id": "TKT-001",
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Unable to access billing tab",
    "description": "Getting a 403 Forbidden error message when clicking billing.",
    "status": "Open",
    "created_at": "2026-05-27T18:20:00Z",
    "updated_at": "2026-05-27T18:20:00Z",
    "notes": [
      {
        "id": 1,
        "ticket_id": "TKT-001",
        "note_text": "Spoke to billing team, verifying active roles.",
        "created_at": "2026-05-27T18:21:40Z"
      }
    ]
  }
  ```

### 4. Update Ticket (Status or Notes)
* **Endpoint**: `PUT /api/tickets/{ticket_id}`
* **Request Body** (Both fields are optional):
  ```json
  {
    "status": "In Progress",
    "notes": "Assigned to the engineering department."
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "updated_at": "2026-05-27T18:22:00Z"
  }
  ```

---

## 💻 Local Quick Start

Follow these steps to run the application locally on your computer:

### 1. Prerequisites
Ensure you have Python 3.8+ installed.

### 2. Install Dependencies
Navigate to the root directory and install Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Launch the FastAPI development ASGI server using Uvicorn:
```bash
uvicorn main:app --reload
```
* The `--reload` flag automatically refreshes the server whenever you edit files.

### 4. Open in Browser
* **Web UI (Frontend)**: Open your browser and navigate to `http://127.0.0.1:8000/`.
* **API Documentation (Swagger UI)**: Open `http://127.0.0.1:8000/docs` to test endpoints interactively.

---

## ☁️ Deployment (Railway.app)

This application is ready for immediate deployment on **Railway.app** with a single command or GitHub push.

1. **Procfile Included**: We have packaged a `Procfile` instructing Railway to run:
   `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
2. **Environment Independent**: The backend automatically reads the `$PORT` environment variable provided by Railway.
3. **Database Portability**: The SQLite `sqlite.db` is generated automatically on deployment start. 
   *(Note: For production persistent data, remember to add a volume mount in Railway to save the `sqlite.db` file across restarts).*

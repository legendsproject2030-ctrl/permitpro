from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import anthropic
import httpx
import os
import json
import base64
from typing import Optional
from supabase import create_client, Client

app = FastAPI(title="PermitPro API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://permitpro-32ft.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Clients ---
def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)

def get_anthropic():
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

security = HTTPBearer()

# --- Models ---
class AnswerPayload(BaseModel):
    session_id: str
    field_id: str
    answer: str

class CompleteSessionPayload(BaseModel):
    session_id: str

# --- Auth Helper ---
def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    supabase = get_supabase()
    token = credentials.credentials
    response = supabase.auth.get_user(token)
    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.user.id

# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload-permit")
async def upload_permit(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id)
):
    """Upload a permit PDF, extract fields via PDF.co, generate questions via Claude."""
    supabase = get_supabase()
    claude = get_anthropic()

    # 1. Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 20MB.")

    # 2. Upload to Supabase Storage
    file_path = f"{user_id}/{file.filename}"
    supabase.storage.from_("permits").upload(file_path, file_bytes, {"content-type": "application/pdf"})
    public_url = supabase.storage.from_("permits").get_public_url(file_path)

    # 3. Extract fields from PDF via PDF.co
    pdfco_key = os.environ["PDFCO_API_KEY"]
    async with httpx.AsyncClient(timeout=60) as client:
        # Upload file to PDF.co
        upload_resp = await client.post(
            "https://api.pdf.co/v1/file/upload/base64",
            headers={"x-api-key": pdfco_key},
            json={
                "name": file.filename,
                "file": base64.b64encode(file_bytes).decode()
            }
        )
        upload_data = upload_resp.json()
        pdf_url = upload_data.get("url", public_url)

        # Get form fields
        fields_resp = await client.post(
            "https://api.pdf.co/v1/pdf/info/fields",
            headers={"x-api-key": pdfco_key},
            json={"url": pdf_url, "async": False}
        )
        fields_data = fields_resp.json()

    raw_fields = fields_data.get("fields", [])

    # If no fillable fields found, use Claude to extract via OCR approach
    if not raw_fields:
        # Send PDF as base64 to Claude for OCR field detection
        b64_pdf = base64.standard_b64encode(file_bytes).decode("utf-8")
        ocr_msg = claude.messages.create(
            model="claude-opus-4-6",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {"type": "base64", "media_type": "application/pdf", "data": b64_pdf}
                    },
                    {
                        "type": "text",
                        "text": """This is an Ontario permit document. Identify all fields that need to be filled in.
Return a JSON array only, no other text. Each item:
{"field_name": "raw field name", "field_type": "text|date|number|dropdown", "x": 0, "y": 0, "page": 1}
Use x/y as approximate percentage positions (0-100) on the page."""
                    }
                ]
            }]
        )
        try:
            raw_fields = json.loads(ocr_msg.content[0].text)
        except Exception:
            raw_fields = []

    # 4. Use Claude to generate plain-English questions for each field
    field_names = [f.get("field_name", f.get("name", "")) for f in raw_fields]

    prompt = f"""You are processing an Ontario, Canada permit document. 
Here are the raw field names extracted from the permit: {json.dumps(field_names)}

For each field, return a JSON array. Each object must have:
- field_name: the original field name exactly
- question: plain-English question to ask an Ontario resident (e.g. "What is the civic address of the property?")
- helper: 1-2 sentence explanation of what this field means and why it is required, written for Ontario context. Use Canadian spelling.
- input_type: one of "text", "date", "number", "dropdown"
- dropdown_options: array of strings if input_type is dropdown, otherwise null
- step_number: integer starting at 1

Return ONLY valid JSON array, no markdown, no explanation."""

    response = claude.messages.create(
        model="claude-opus-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    try:
        questions = json.loads(response.content[0].text)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    # 5. Detect permit name and municipality
    detect_prompt = f"""This is an Ontario permit. Based on these field names: {json.dumps(field_names[:10])}
Return JSON only: {{"permit_name": "...", "municipality": "..."}}
If you cannot determine, use "Ontario Permit" and "Unknown" respectively."""

    detect_resp = claude.messages.create(
        model="claude-opus-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": detect_prompt}]
    )
    try:
        meta = json.loads(detect_resp.content[0].text)
    except Exception:
        meta = {"permit_name": file.filename.replace(".pdf", ""), "municipality": "Unknown"}

    # 6. Create session in Supabase
    session = supabase.table("permit_sessions").insert({
        "user_id": user_id,
        "permit_name": meta["permit_name"],
        "municipality": meta["municipality"],
        "original_pdf_url": public_url,
        "pdf_co_url": pdf_url,
        "status": "not_started",
        "current_step": 1,
        "total_steps": len(questions),
        "file_name": file.filename
    }).execute()

    session_id = session.data[0]["id"]

    # 7. Insert fields
    fields_to_insert = []
    for i, q in enumerate(questions):
        orig = raw_fields[i] if i < len(raw_fields) else {}
        fields_to_insert.append({
            "session_id": session_id,
            "field_name": q["field_name"],
            "question": q["question"],
            "helper": q["helper"],
            "input_type": q["input_type"],
            "dropdown_options": json.dumps(q.get("dropdown_options") or []),
            "step_number": q["step_number"],
            "answer": None,
            "x_position": orig.get("x", 0),
            "y_position": orig.get("y", 0),
            "page_number": orig.get("page", 1)
        })

    supabase.table("permit_fields").insert(fields_to_insert).execute()

    return {
        "session_id": session_id,
        "permit_name": meta["permit_name"],
        "municipality": meta["municipality"],
        "total_fields": len(questions),
        "fields_preview": [q["field_name"] for q in questions]
    }


@app.get("/session/{session_id}")
def get_session(session_id: str, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    session = supabase.table("permit_sessions").select("*").eq("id", session_id).eq("user_id", user_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    fields = supabase.table("permit_fields").select("*").eq("session_id", session_id).order("step_number").execute()
    return {"session": session.data, "fields": fields.data}


@app.get("/sessions")
def get_sessions(user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    sessions = supabase.table("permit_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"sessions": sessions.data}


@app.post("/save-answer")
def save_answer(payload: AnswerPayload, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    # Verify session ownership
    session = supabase.table("permit_sessions").select("id, current_step").eq("id", payload.session_id).eq("user_id", user_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save answer
    supabase.table("permit_fields").update({"answer": payload.answer}).eq("id", payload.field_id).execute()

    # Get the step number of this field
    field = supabase.table("permit_fields").select("step_number").eq("id", payload.field_id).single().execute()
    next_step = field.data["step_number"] + 1

    # Update session current step and status
    total = session.data.get("total_steps", 1)
    status = "completed" if next_step > total else "in_progress"
    supabase.table("permit_sessions").update({"current_step": next_step, "status": status}).eq("id", payload.session_id).execute()

    return {"saved": True, "next_step": next_step, "status": status}


@app.post("/complete-permit")
async def complete_permit(payload: CompleteSessionPayload, user_id: str = Depends(get_user_id)):
    """Fill the PDF with all answers and return download URL."""
    supabase = get_supabase()
    pdfco_key = os.environ["PDFCO_API_KEY"]

    session = supabase.table("permit_sessions").select("*").eq("id", payload.session_id).eq("user_id", user_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    fields = supabase.table("permit_fields").select("*").eq("session_id", payload.session_id).execute()
    session_data = session.data
    fields_data = fields.data

    # Build fields array for PDF.co
    fill_fields = []
    annotations = []
    for f in fields_data:
        if f.get("answer"):
            if f.get("x_position") and f.get("y_position"):
                # Scanned PDF — use text annotation overlay
                annotations.append({
                    "text": f["answer"],
                    "x": f["x_position"],
                    "y": f["y_position"],
                    "size": 10,
                    "pages": str(f.get("page_number", 1))
                })
            else:
                # Fillable PDF
                fill_fields.append({
                    "fieldName": f["field_name"],
                    "pages": str(f.get("page_number", "1")),
                    "text": f["answer"]
                })

    async with httpx.AsyncClient(timeout=60) as client:
        if fill_fields:
            resp = await client.post(
                "https://api.pdf.co/v1/pdf/edit/add",
                headers={"x-api-key": pdfco_key},
                json={
                    "url": session_data["pdf_co_url"],
                    "fieldsString": json.dumps(fill_fields),
                    "async": False
                }
            )
        else:
            resp = await client.post(
                "https://api.pdf.co/v1/pdf/edit/add",
                headers={"x-api-key": pdfco_key},
                json={
                    "url": session_data["pdf_co_url"],
                    "annotationsString": json.dumps(annotations),
                    "async": False
                }
            )

        result = resp.json()
        completed_url = result.get("url", "")

    # Save completed URL
    supabase.table("permit_sessions").update({
        "completed_pdf_url": completed_url,
        "status": "completed"
    }).eq("id", payload.session_id).execute()

    return {"completed_pdf_url": completed_url}


@app.delete("/session/{session_id}")
def delete_session(session_id: str, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    supabase.table("permit_fields").delete().eq("session_id", session_id).execute()
    supabase.table("permit_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
    return {"deleted": True}

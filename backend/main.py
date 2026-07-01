import io
import json

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader


class AnalysisResponse(BaseModel):
    strengths: list[str] = Field(..., description="Key strengths from the CV")
    gaps: list[str] = Field(..., description="Observed gaps or improvement areas")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-cv", response_model=AnalysisResponse)
async def analyze_cv(file: UploadFile = File(...)) -> AnalysisResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if not extracted_text:
            raise HTTPException(status_code=422, detail="No text could be extracted from that PDF.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to read PDF: {exc}") from exc

    system_prompt = (
        "You are a strict career analysis assistant. Return JSON only. "
        "The output must match this schema exactly: {'strengths': ['...'], 'gaps': ['...']}. "
        "Do not include any extra text, markdown, or code fences."
    )
    user_prompt = (
        "Analyze the following CV text for suitability for degree apprenticeships.\n\n"
        f"CV TEXT:\n{extracted_text[:12000]}"
    )

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "llama3",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "stream": False,
                    "format": "json",
                },
            )
            response.raise_for_status()
            payload = response.json()
            raw_text = payload["message"]["content"].strip()
            if not raw_text:
                raise ValueError("Ollama returned an empty response")
            parsed = json.loads(raw_text)
            return AnalysisResponse(**parsed)
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=502, 
            detail=f"Ollama Connection Refused. Check if port 11434 is blocked. Error: {exc}"
        ) from exc
    except httpx.ConnectTimeout as exc:
        raise HTTPException(
            status_code=504, 
            detail=f"Ollama timed out while trying to connect. Error: {exc}"
        ) from exc
    except httpx.ReadTimeout as exc:
        raise HTTPException(
            status_code=504, 
            detail="Ollama connected, but took longer than 30 seconds to generate the response. Try increasing your timeout value."
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502, 
            detail=f"Ollama returned an HTTP error code: {exc.response.status_code}. Details: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, 
            detail=f"Ollama service generic request failure: {exc}"
        ) from exc
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=502, 
            detail=f"Ollama output decoding failed. Model raw text: {raw_text}. Error: {exc}"
        ) from exc


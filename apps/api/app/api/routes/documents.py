from fastapi import APIRouter, File, UploadFile

from app.schemas.domain import (
    DocumentRead,
    DocumentSearchRequest,
    DocumentSearchResponse,
    MeetingDocumentAnalysisRead,
)
from app.services.documents import (
    analyze_meeting_document,
    get_document,
    list_documents,
    search_documents,
)

router = APIRouter()


@router.get("", response_model=list[DocumentRead])
def list_documents_route():
    return list_documents()


@router.get("/{document_id}", response_model=DocumentRead)
def get_document_route(document_id: str):
    return get_document(document_id)


@router.post("/search", response_model=DocumentSearchResponse)
def search_documents_route(payload: DocumentSearchRequest):
    return search_documents(payload)


@router.post("/analyze-meeting", response_model=MeetingDocumentAnalysisRead)
async def analyze_meeting_document_route(file: UploadFile = File(...)):
    content = await file.read()
    return analyze_meeting_document(
        file_name=file.filename or "meeting-document",
        content_type=file.content_type,
        content=content,
    )

from fastapi import HTTPException

from app.schemas.domain import (
    DocumentSearchRequest,
    DocumentSearchResponse,
    MeetingDocumentAnalysisRead,
)
from app.services import seed_data


def list_documents():
    return seed_data.DOCUMENTS


def get_document(document_id: str):
    for document in seed_data.DOCUMENTS:
        if document.id == document_id:
            return document
    return seed_data.DOCUMENTS[0].model_copy(update={"id": document_id})


def search_documents(payload: DocumentSearchRequest) -> DocumentSearchResponse:
    return seed_data.DOCUMENT_SEARCH.model_copy(update={"query": payload.query})


def analyze_meeting_document(
    file_name: str,
    content_type: str | None,
    content: bytes,
) -> MeetingDocumentAnalysisRead:
    normalized_name = file_name.lower()
    if not file_name:
        raise HTTPException(status_code=400, detail="File name is required")

    document_type = "weekly_meeting_pdf" if normalized_name.endswith(".pdf") else "uploaded_document"
    summary = (
        "업로드한 회의자료에서 생산, 품질, 구매/자재 관련 지시사항과 담당자, 일정 후보를 추출했습니다."
        if content
        else "문서 내용이 비어 있어 파일명과 기본 규칙만으로 지시사항 후보를 생성했습니다."
    )

    sections = [
        "공통 지시사항",
        "생산/생관/제조본부장",
        "품질",
        "구매·자재/경영지원",
    ]

    directives = [directive.model_copy() for directive in seed_data.MEETING_DIRECTIVES]

    # Simple MVP heuristic: quality-related filenames prioritize quality items first.
    if "품질" in file_name or "quality" in normalized_name:
        directives.sort(key=lambda item: (item.department_code != "QUAL", item.id))

    return MeetingDocumentAnalysisRead(
        file_name=file_name,
        document_type=document_type,
        summary=summary,
        directives=directives,
        detected_sections=sections,
    )

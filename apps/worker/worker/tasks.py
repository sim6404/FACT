from worker.celery_app import celery_app


@celery_app.task(name="reports.generate_weekly_report")
def generate_weekly_report(report_id: str) -> dict:
    return {
        "report_id": report_id,
        "status": "queued_stub",
        "message": "주간 보고서 생성 파이프라인은 다음 단계에서 Jinja2/PDF/PPT 생성기로 연결됩니다.",
    }

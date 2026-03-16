import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response

from app.api.router import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.services.system import get_system_health

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)

API_ENDPOINTS = [
    {"name": "API health", "method": "GET", "path": "/health"},
    {"name": "System health", "method": "GET", "path": f"{settings.api_prefix}/system/health"},
    {"name": "Dashboard summary", "method": "GET", "path": f"{settings.api_prefix}/dashboard/summary"},
    {"name": "Dashboard alerts", "method": "GET", "path": f"{settings.api_prefix}/dashboard/alerts"},
    {"name": "Meeting directives", "method": "GET", "path": f"{settings.api_prefix}/dashboard/directives"},
    {"name": "Directive detail", "method": "GET", "path": f"{settings.api_prefix}/dashboard/directives/{{directive_id}}"},
    {"name": "Directive status update", "method": "POST", "path": f"{settings.api_prefix}/dashboard/directives/{{directive_id}}/status"},
    {"name": "Agent query", "method": "POST", "path": f"{settings.api_prefix}/agent/query"},
    {"name": "Agent runs", "method": "GET", "path": f"{settings.api_prefix}/agent/runs"},
    {"name": "Reports", "method": "GET", "path": f"{settings.api_prefix}/reports"},
    {"name": "Approvals", "method": "GET", "path": f"{settings.api_prefix}/approvals"},
    {"name": "Documents", "method": "GET", "path": f"{settings.api_prefix}/documents"},
    {"name": "Analyze meeting document", "method": "POST", "path": f"{settings.api_prefix}/documents/analyze-meeting"},
    {"name": "Production inquiries", "method": "GET", "path": f"{settings.api_prefix}/production/inquiries"},
    {"name": "Create production inquiry", "method": "POST", "path": f"{settings.api_prefix}/production/inquiries"},
    {"name": "Update production inquiry", "method": "POST", "path": f"{settings.api_prefix}/production/inquiries/{{inquiry_id}}"},
    {"name": "Clone production inquiry", "method": "POST", "path": f"{settings.api_prefix}/production/inquiries/{{inquiry_id}}/clone"},
    {"name": "Inquiry change history", "method": "GET", "path": f"{settings.api_prefix}/production/inquiries/{{inquiry_id}}/history"},
    {"name": "Production items", "method": "GET", "path": f"{settings.api_prefix}/production/items"},
    {"name": "Apply production item", "method": "POST", "path": f"{settings.api_prefix}/production/inquiries/{{inquiry_id}}/select-item"},
    {"name": "Production processes", "method": "GET", "path": f"{settings.api_prefix}/production/processes"},
    {"name": "Production process detail", "method": "GET", "path": f"{settings.api_prefix}/production/processes/{{process_id}}/detail"},
    {"name": "Production process action", "method": "POST", "path": f"{settings.api_prefix}/production/processes/{{process_id}}/action"},
    {"name": "Saved queries", "method": "GET", "path": f"{settings.api_prefix}/saved-queries"},
    {"name": "Connector runs", "method": "GET", "path": f"{settings.api_prefix}/connectors/runs"},
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.on_event("startup")
def on_startup() -> None:
    if settings.auto_create_tables:
        try:
            init_db()
            _seed_production_if_db_ready()
        except Exception as exc:  # pragma: no cover - startup fallback
            logger.warning("Database initialization skipped: %s", exc)


def _seed_production_if_db_ready() -> None:
    """Seed production reference data into DB on first run."""
    if not settings.enable_db_persistence:
        return
    try:
        from app.db.session import SessionLocal
        from app.services.persistence import (
            ensure_default_identity,
            seed_production_inquiries,
            seed_production_items,
        )

        with SessionLocal() as db:
            ensure_default_identity(db)
            seed_production_items(db)
            seed_production_inquiries(db)
            db.commit()
    except Exception as exc:  # pragma: no cover
        logger.warning("Production seed skipped: %s", exc)


def _build_root_payload() -> dict:
    return {
        "name": "F.A.C.T API",
        "description": "Weekly meeting and manufacturing ERP automation backend",
        "version": "0.1.0",
        "environment": settings.app_env,
        "docs": {
            "openapi": "/openapi.json",
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "html_home": "/",
        },
        "health": {
            "public": "/health",
            "system": f"{settings.api_prefix}/system/health",
        },
        "erp_scope": [
            "weekly meeting command center",
            "production / manufacturing tracking",
            "quality issue and defect control",
            "sales plan vs actual analysis",
            "procurement / inventory workflow",
            "directive and approval automation",
        ],
        "endpoints": API_ENDPOINTS,
    }


def _build_root_html() -> str:
    endpoint_rows = "".join(
        f"""
        <tr>
          <td>{item["name"]}</td>
          <td><span class="method">{item["method"]}</span></td>
          <td><code>{item["path"]}</code></td>
        </tr>
        """
        for item in API_ENDPOINTS
    )
    return f"""
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>F.A.C.T API</title>
        <style>
          :root {{
            color-scheme: light;
            font-family: Arial, "Noto Sans KR", sans-serif;
          }}
          body {{
            margin: 0;
            background: linear-gradient(180deg, #f8fbff 0%, #f3f7fb 100%);
            color: #0f172a;
          }}
          .page {{
            max-width: 1120px;
            margin: 0 auto;
            padding: 40px 24px 56px;
          }}
          .hero {{
            border: 1px solid #dbe4f0;
            border-radius: 24px;
            background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 58%, #0f172a 100%);
            color: white;
            padding: 32px;
            box-shadow: 0 20px 50px -30px rgba(37, 99, 235, 0.45);
          }}
          .eyebrow {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.12);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }}
          .hero h1 {{
            margin: 16px 0 8px;
            font-size: 40px;
          }}
          .hero p {{
            margin: 0;
            max-width: 760px;
            font-size: 15px;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.92);
          }}
          .grid {{
            display: grid;
            gap: 20px;
            grid-template-columns: 1.4fr 1fr;
            margin-top: 24px;
          }}
          .card {{
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.94);
            padding: 24px;
            box-shadow: 0 12px 32px -24px rgba(15, 23, 42, 0.2);
          }}
          .card h2 {{
            margin: 0 0 8px;
            font-size: 18px;
          }}
          .meta {{
            display: grid;
            gap: 12px;
            margin-top: 16px;
          }}
          .meta-item {{
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 12px 14px;
            border-radius: 14px;
            background: #f8fafc;
            font-size: 14px;
          }}
          .links {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 16px;
          }}
          .links a {{
            color: #0f172a;
            text-decoration: none;
            border: 1px solid #cbd5e1;
            background: white;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
          }}
          table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }}
          th, td {{
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            font-size: 14px;
            vertical-align: top;
          }}
          th {{
            color: #64748b;
            font-weight: 600;
          }}
          code {{
            font-family: Consolas, monospace;
            font-size: 13px;
            color: #0f172a;
          }}
          .method {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 999px;
            background: #e0f2fe;
            color: #0369a1;
            font-size: 12px;
            font-weight: 700;
          }}
          @media (max-width: 860px) {{
            .grid {{
              grid-template-columns: 1fr;
            }}
            .hero h1 {{
              font-size: 32px;
            }}
          }}
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <span class="eyebrow">FACT API Workspace</span>
            <h1>F.A.C.T API</h1>
            <p>주간회의 자료 분석, 생산/품질/영업/구매 업무 추적, 지시사항 자동화에 사용되는 제조 ERP 백엔드입니다.</p>
          </section>

          <section class="grid">
            <div class="card">
              <h2>Service Summary</h2>
              <div class="meta">
                <div class="meta-item"><span>Name</span><strong>F.A.C.T API</strong></div>
                <div class="meta-item"><span>Environment</span><strong>{settings.app_env}</strong></div>
                <div class="meta-item"><span>API Prefix</span><strong>{settings.api_prefix}</strong></div>
                <div class="meta-item"><span>Health</span><strong>/health</strong></div>
              </div>
              <div class="links">
                <a href="/docs">Swagger UI</a>
                <a href="/redoc">ReDoc</a>
                <a href="/openapi.json">OpenAPI JSON</a>
                <a href="/health">Health Check</a>
              </div>
            </div>

            <div class="card">
              <h2>Status</h2>
              <div class="meta">
                <div class="meta-item"><span>API</span><strong>up</strong></div>
                <div class="meta-item"><span>PostgreSQL</span><strong>planned / optional</strong></div>
                <div class="meta-item"><span>Redis</span><strong>planned / optional</strong></div>
                <div class="meta-item"><span>Snowflake</span><strong>planned / mock/live mode</strong></div>
              </div>
            </div>
          </section>

          <section class="card" style="margin-top: 20px;">
            <h2>ERP Automation Scope</h2>
            <div class="meta" style="margin-bottom: 20px;">
              <div class="meta-item"><span>1</span><strong>Weekly meeting directive extraction</strong></div>
              <div class="meta-item"><span>2</span><strong>Production and quality KPI tracking</strong></div>
              <div class="meta-item"><span>3</span><strong>Sales gap and procurement follow-up</strong></div>
            </div>
          </section>

          <section class="card" style="margin-top: 20px;">
            <h2>Main Endpoints</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Method</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {endpoint_rows}
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
    """.strip()


@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")

    if "text/html" in accept:
        return HTMLResponse(_build_root_html())

    return JSONResponse(_build_root_payload())


@app.get("/health")
def public_health():
    health = get_system_health()
    return {
        "status": health.status,
        "services": health.services,
        "api_prefix": settings.api_prefix,
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    svg = """
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="factGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0f172a" />
      <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#factGradient)" />
      <path d="M20 22h24v6H27v8h13v6H27v12h-7V22z" fill="#ffffff" />
    </svg>
    """.strip()
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=86400"},
    )

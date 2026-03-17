# FACT ERP 배포 가이드

## 자동 배포 방법

### 1. 로컬에서 `npm run deploy` 실행 (권장)

```bash
npm run deploy
```

**순서:** 빌드 → Git 커밋/푸시 → Vercel 프로덕션 배포

### 2. GitHub Actions (푸시 시 자동 배포)

`main` 브랜치에 푸시 시 GitHub Actions가 Vercel에 배포합니다.

**필수: GitHub 리포지토리 Secrets 설정**

1. GitHub → Settings → Secrets and variables → Actions
2. 아래 3개 Secret 추가:

| Secret 이름 | 값 | 획득 방법 |
|------------|-----|----------|
| `VERCEL_TOKEN` | `vercel_xxx...` | [vercel.com/account/tokens](https://vercel.com/account/tokens) 에서 발급 |
| `VERCEL_ORG_ID` | `team_4ufF9HXLd35AocWwgnAGWJvL` | 현재 팀 ID |
| `VERCEL_PROJECT_ID` | `prj_FP1qCqBjKV3DoCAhhmB5fBBvUewe` | fact-erp 프로젝트 ID |

### 3. Vercel Git 연동 (웹훅 배포)

Vercel 대시보드에서 GitHub 연동을 설정하면 푸시 시 자동 배포됩니다.

1. [vercel.com](https://vercel.com) → fact-erp 프로젝트
2. Settings → Git → Connect Git Repository
3. sim6404/FACT 저장소 연결, Production Branch: `main`
4. 연결 후 푸시 시 웹훅으로 자동 배포

**배포가 안 될 때:** Git → Disconnect 후 재연결하여 웹훅 재생성

## 프로덕션 URL

- https://fact-erp.vercel.app

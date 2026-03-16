# Vercel 배포 가이드

## ⚠️ 404 NOT_FOUND 오류 해결

이 프로젝트는 **모노레포** 구조입니다. Next.js 앱이 `apps/web`에 있으므로,  
Vercel에서 반드시 **Root Directory**를 설정해야 합니다.

**원인**: Root Directory 미설정 시 Vercel이 Python API(`apps/api`)를 빌드하여  
Next.js 앱이 배포되지 않고 404가 발생합니다.

### 1. 새 프로젝트로 배포할 때

1. [vercel.com](https://vercel.com) → **Add New Project** → `sim6404/FACT` 선택
2. **Configure Project** 화면에서:

| 설정 | 값 |
|------|-----|
| **Root Directory** | `apps/web` ← **필수** (Edit 클릭 후 입력) |
| Framework Preset | Next.js (자동 감지) |
| Build Command | `npm run build` (기본값) |
| Output Directory | (비워두기) |

3. **Environment Variables**:
   - `NEXT_PUBLIC_API_ENABLED` = `false`

4. **Deploy** 클릭

### 2. 기존 프로젝트(sim6404-factai) 404 수정

1. [vercel.com](https://vercel.com) → **sim6404-factai** 프로젝트 선택
2. **Settings** → **General**
3. **Root Directory** → **Edit** → `apps/web` 입력 → **Save**
4. **Deployments** 탭 → **Redeploy** (최신 배포 옆 ⋮ 메뉴)

### 3. Root Directory를 설정하지 않으면?

- Vercel이 repo 루트에서 `requirements.txt`(apps/api)를 우선 인식 → Python 프로젝트 빌드
- Next.js 앱(`apps/web`)이 배포되지 않음 → **404 NOT_FOUND**

# Vercel 배포 가이드

## ⚠️ NOT_FOUND 오류 해결

이 프로젝트는 **모노레포** 구조입니다. Next.js 앱이 `apps/web`에 있으므로,  
Vercel에서 반드시 **Root Directory**를 설정해야 합니다.

### 1. Vercel 프로젝트 설정

1. [vercel.com](https://vercel.com) → **Add New Project** → `sim6404/FACT` 선택
2. **Configure Project** 화면에서:

| 설정 | 값 |
|------|-----|
| **Root Directory** | `apps/web` ← **필수** |
| Framework Preset | Next.js (자동 감지) |
| Build Command | `npm run build` (기본값) |
| Output Directory | (비워두기, Next.js가 자동 처리) |

3. **Environment Variables**:
   - `NEXT_PUBLIC_API_ENABLED` = `false`

4. **Deploy** 클릭

### 2. Root Directory를 설정하지 않으면?

- Vercel이 repo 루트(`/`)에서 `next.config.ts`, `package.json`의 `next build`를 찾음
- 이 프로젝트는 루트에 `package.json`만 있고, Next.js 앱은 `apps/web`에 있음
- → **NOT_FOUND** 또는 빌드 실패 발생

### 3. 기존 프로젝트에서 수정하는 방법

1. Vercel Dashboard → 해당 프로젝트 → **Settings**
2. **General** → **Root Directory** → `apps/web` 입력 후 **Save**
3. **Deployments** → 최신 배포 → **Redeploy**

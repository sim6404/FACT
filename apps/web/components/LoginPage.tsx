"use client";
/**
 * F.A.C.T ERP 로그인 — 영동테크 브랜드
 * 레퍼런스: Factumsoft/BrickWorx 스타일 (상단 건물사진+오버레이 / 하단 라이트그레이 / 중앙 카드)
 *
 * ─ 배경 이미지 교체 방법 ──────────────────────────────────────
 *   BG_IMAGE 상수를 영동테크 실제 건물 사진 URL로 변경하세요.
 *   예) const BG_IMAGE = "http://youngdongtech.com/theme/ydtech/img/main_visual01.jpg";
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, User, Lock, Shield } from "lucide-react";

// ── 영동테크 건물 사진 (public/yd-building.png) ───────────────────────────────
const BG_IMAGE = "/yd-building.png";

// ── 계정 ─────────────────────────────────────────────────────────────────────
export type UserRole = "관리자" | "일반";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  dept: string;
  initial: string;
}

const ACCOUNTS: Array<AuthUser & { password: string }> = [
  { id: "admin",  password: "admin1234",  name: "심현보",  role: "관리자", dept: "시스템관리",  initial: "심" },
  { id: "prod",   password: "prod1234",   name: "이생산",  role: "일반",   dept: "생산관리팀",  initial: "이" },
  { id: "qc",     password: "qc1234",     name: "박품질",  role: "일반",   dept: "품질관리팀",  initial: "박" },
  { id: "sales",  password: "sales1234",  name: "최영업",  role: "일반",   dept: "영업개발팀",  initial: "최" },
  { id: "buyer",  password: "buyer1234",  name: "김구매",  role: "일반",   dept: "구매자재팀",  initial: "김" },
];

interface Props { onLogin: (user: AuthUser) => void; }

// ── 로그인 입력 필드 — 세련된 풀 보더 + 아이콘 분리 스타일 ──────────────────
function LoginInput({
  placeholder, value, onChange, onKeyDown, type = "text",
  icon, rightSlot,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  type?: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative flex items-center overflow-hidden"
      style={{
        height: 50,
        borderRadius: 10,
        outline: "none",
        border: "none",
        background: focused ? "#eef8f9" : "#f4f7f8",
        boxShadow: focused ? "0 0 0 1.5px #0d7f8a" : "none",
        transition: "background 0.18s, box-shadow 0.18s",
      }}
    >
      {/* 왼쪽 아이콘 영역 */}
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 44,
          color: focused ? "#0d7f8a" : "#9ab8c2",
          transition: "color 0.18s",
        }}
      >
        {icon}
      </span>
      {/* 세로 구분선 */}
      <span
        style={{
          width: 1,
          height: 18,
          background: focused ? "rgba(13,127,138,0.3)" : "rgba(0,0,0,0.08)",
          flexShrink: 0,
          transition: "background 0.18s",
        }}
      />
      {/* 입력 필드 */}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1,
          height: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
          fontSize: 14,
          color: "#1a2b35",
          paddingLeft: 12,
          paddingRight: 12,
        }}
        className="placeholder:text-[#a8c0ca]"
      />
      {/* 오른쪽 슬롯 (비밀번호 토글 등) */}
      {rightSlot && (
        <span className="flex shrink-0 items-center justify-center pr-3" style={{ color: "#9ab8c2" }}>
          {rightSlot}
        </span>
      )}
    </div>
  );
}

// ── 영동테크 YD 로고 이미지 ──────────────────────────────────────────────────
function YDMark({ height = 36 }: { height?: number }) {
  return (
    <img
      src="/yd-logo.png"
      alt="영동테크"
      style={{ height, objectFit: "contain", display: "block" }}
    />
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: Props) {
  const [id,     setId]     = useState("");
  const [pw,     setPw]     = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error,  setError]  = useState("");
  const [loading,setLoad]   = useState(false);

  const doLogin = async () => {
    if (!id.trim() || !pw.trim()) { setError("아이디와 비밀번호를 입력해주세요."); return; }
    setLoad(true);
    await new Promise(r => setTimeout(r, 500));
    const acc = ACCOUNTS.find(a => a.id === id && a.password === pw);
    setLoad(false);
    if (!acc) { setError("아이디 또는 비밀번호가 올바르지 않습니다."); return; }
    const { password: _, ...user } = acc;
    onLogin(user);
  };

  const quickFill = (uid: string, upw: string) => { setId(uid); setPw(upw); setError(""); };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      }}
    >
      {/* ── 배경: 건물 사진 — img 태그로 전체 화면 채우기 ──────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BG_IMAGE}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          zIndex: 0,
        }}
      />

      {/* ── 오버레이: 반투명 다크 레이어 (사진이 보이도록 60% 이하) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(160deg, rgba(5,20,32,0.65) 0%, rgba(8,38,52,0.55) 50%, rgba(10,48,62,0.62) 100%)",
        }}
      />

      {/* ── 상단 좌측: 회사 브랜드 ──────────────────────────────────── */}
      <div style={{ position: "absolute", left: 20, top: 16, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded font-black text-white"
          style={{ background: "#0d7f8a", fontSize: 13, letterSpacing: "-0.04em" }}
        >
          YD
        </div>
        <span className="font-semibold text-white" style={{ fontSize: 13 }}>영동테크</span>
      </div>

      {/* ── 중앙 로그인 카드 ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth: 420,
          padding: "0 16px",
          zIndex: 10,
        }}
      >
        {/* ── 카드 본체 ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.18)",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* 카드 헤더 — "Log In" 스타일 */}
          <div
            className="text-center"
            style={{
              padding: "22px 32px 20px",
              borderBottom: "1px solid #e8ecf0",
            }}
          >
            <p
              className="text-[#1a2b35]"
              style={{ fontSize: 20, fontWeight: 500, letterSpacing: "0.01em" }}
            >
              Log In
            </p>
          </div>

          {/* 카드 내용 */}
          <div style={{ padding: "24px 32px 28px" }}>

            {/* 로고 + 시스템명 — 중앙 정렬 */}
            <div
              className="flex flex-col items-center gap-2"
              style={{ marginBottom: 22 }}
            >
              {/* 영동테크 로고 이미지 */}
              <YDMark height={34} />
              {/* FACT ERP 시스템 타이틀 */}
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <p
                  className="font-black text-[#1a2b35]"
                  style={{ fontSize: 20, letterSpacing: "-0.04em", lineHeight: 1 }}
                >
                  F.A.C.T ERP
                </p>
                <p style={{ fontSize: 10, color: "#8fa8b5", marginTop: 4, letterSpacing: "0.04em" }}>
                  제조 통합관리 플랫폼
                </p>
              </div>
            </div>

            {/* 빠른 로그인 — 레퍼런스 스타일 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => quickFill("admin", "admin1234")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 38, borderRadius: 8,
                  border: id === "admin" ? "1.5px solid #0d7f8a" : "1.5px solid #dde5ea",
                  background: id === "admin" ? "#e6f6f7" : "#f8fafb",
                  color: id === "admin" ? "#0a5f6e" : "#6b8290",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Shield size={13} /> 관리자
              </button>
              <button
                onClick={() => quickFill("prod", "prod1234")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 38, borderRadius: 8,
                  border: id === "prod" ? "1.5px solid #059669" : "1.5px solid #dde5ea",
                  background: id === "prod" ? "#ecfdf5" : "#f8fafb",
                  color: id === "prod" ? "#047857" : "#6b8290",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <User size={13} /> 일반 사용자
              </button>
            </div>

            {/* 아이디 입력 */}
            <div style={{ marginBottom: 10 }}>
              <LoginInput
                placeholder="아이디"
                value={id}
                onChange={v => { setId(v); setError(""); }}
                onKeyDown={e => e.key === "Enter" && doLogin()}
                icon={<User size={16} />}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div style={{ marginBottom: 10 }}>
              <LoginInput
                placeholder="비밀번호"
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={v => { setPw(v); setError(""); }}
                onKeyDown={e => e.key === "Enter" && doLogin()}
                icon={<Lock size={16} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display:"flex", alignItems:"center" }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 12px", marginBottom: 10, borderRadius: 8,
                  background: "#fff1f2", border: "1.5px solid #fecdd3",
                  fontSize: 12, color: "#e11d48",
                }}
              >
                <AlertCircle size={12} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* 우측 정렬 안내 링크 — 레퍼런스 스타일 */}
            <div style={{ textAlign: "right", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#0d7f8a", cursor: "pointer" }}>
                로그인에 문제가 있으신가요?
              </span>
            </div>

            {/* 로그인 버튼 — 풀 너비, 테일 그라디언트 */}
            <button
              onClick={doLogin}
              disabled={loading}
              style={{
                width: "100%", height: 48,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: loading ? "#0a6470" : "linear-gradient(135deg, #0e8896 0%, #0a6472 100%)",
                color: "white", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
                boxShadow: loading ? "none" : "0 4px 14px rgba(13,127,138,0.45)",
                transition: "all 0.18s",
              }}
            >
              {loading ? (
                <svg className="animate-spin" width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M7 2 A5 5 0 0 1 12 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : null}
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>

          {/* 카드 하단: 테스트 계정 */}
          <div
            style={{
              borderTop: "1px solid #e8ecf0",
              background: "#f7f9fa",
              padding: "12px 32px 14px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 9, color: "#8fa8b5", marginBottom: 8, letterSpacing: "0.06em", fontWeight: 600 }}>
              테스트 계정
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                { label: "관리자", id: "admin", pw: "admin1234", color: "#0d7f8a" },
                { label: "생산팀", id: "prod",  pw: "prod1234",  color: "#059669" },
                { label: "품질팀", id: "qc",    pw: "qc1234",    color: "#dc2626" },
                { label: "영업팀", id: "sales", pw: "sales1234", color: "#d97706" },
              ].map(u => (
                <button
                  key={u.id}
                  onClick={() => quickFill(u.id, u.pw)}
                  style={{
                    padding: "6px 4px",
                    border: `1px solid ${u.color}30`,
                    borderRadius: 8,
                    background: "white",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.12s",
                  }}
                >
                  <p style={{ color: u.color, fontSize: 9, fontWeight: 700 }}>{u.label}</p>
                  <p style={{ color: "#9ab0ba", fontSize: 8, fontFamily: "monospace" }}>{u.id}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 카드 하단 안내 텍스트 — 레퍼런스 "Your license will expire..." 스타일 */}
        <p
          style={{
            marginTop: 14,
            textAlign: "center",
            fontSize: 11,
            color: "#5a7080",
          }}
        >
          영동테크 임직원 전용 시스템입니다. 무단 접근은 금지됩니다.
        </p>
      </div>

      {/* ── 하단 좌측 브랜드 정보 ──────────────────────────────────── */}
      <div style={{ position: "absolute", bottom: 16, left: 20, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/yd-logo.png" alt="영동테크" style={{ height: 18, objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.7 }} />
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: 0 }}>F.A.C.T ERP v2.0</p>
      </div>

      {/* ── 하단 우측 저작권 ─────────────────────────────────────── */}
      <div style={{ position: "absolute", bottom: 16, right: 20, zIndex: 10 }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0 }}>Copyright © 2026 영동테크. All Rights Reserved.</p>
      </div>
    </div>
  );
}

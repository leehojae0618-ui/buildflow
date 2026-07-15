# BuildFlow Master Plan

## Project Identity

- Brand: BuildFlow
- Internal Codename: Project Flow
- Product: AI Workflow Design Platform
- Strategic Positioning: AI Result Platform
- Primary Message: 무엇을 만들고 싶나요?
- MVP Strategy: Guided Execution MVP

## Current Status

- Phase: Recommendation
- Sprint: Sprint 4 — Recommendation
- Current Task: S6-001 — Dashboard 2.0
- Development Readiness: Code Complete / Recommendation QA Pending
- Billing Recommendation: Excluded from initial Beta
- Repository Status: Local Git initialized
- Next.js Status: Initialized
- Supabase Status: User created
- GitHub Status: Not connected
- Vercel Status: Not connected

## Completed

- Brand Document
- PRD
- Information Architecture
- User Flow
- MVP Scope
- Documentation Audit
- Development Rule

## Current Decisions

- Brand: BuildFlow
- MVP: Guided Execution
- Visual Builder: Excluded
- Marketplace: Excluded
- Billing: Initial exclusion recommended
- Tool Database: Limited to Template requirements
- Workflow Templates: Quality over quantity
- Primary Automation Platform: n8n
- Design Direction: Dark minimal with cyan accent

## Completed Decisions

- Beta: Invite-only Private Beta
- Visitor Preview: Initial Beta Excluded
- Onboarding: Integrated into New Project
- Recommendation Candidates: Maximum 3
- Initial Templates: 10
- Primary LLM Provider: OpenAI
- Guided Execution: n8n Template Handoff + Setup Guide

## Sprint 1 — Foundation

- [x] Documentation Audit
- [x] Development Rule
- [x] Required Decisions 확정
- [ ] Repository 경로 정리
- [ ] Next.js 초기화
- [ ] Project Structure
- [ ] Code Quality Scripts
- [ ] Supabase 프로젝트 생성
- [x] Supabase Client Foundation
- [x] Supabase CLI Init
- [x] Supabase CLI 연결
- [x] Initial Database Schema and RLS
- [x] Foundation Audit
- [x] Database Documentation
- [x] Database Type Script
- [x] Typed Supabase Clients
- [x] Foundation Cleanup
- [ ] Vercel Preview 준비

## Planned Sprints

### Sprint 2 — Authentication

- [x] Email Signup
- [x] Email Login
- [x] Logout
- [x] Session Refresh
- [x] Protected App Route
- [x] Auth Callback
- [x] Minimal Auth UI
- [x] Profile Creation Trigger
- [x] Email Signup QA
- [x] Email Login QA
- [x] Protected Route QA
- [x] Auth Redirect QA
- [x] Google OAuth
- Password Reset

### Sprint 3 — Core Data

- [x] Project
- [x] Tool Seed
- [x] Workflow Template Seed
- [x] RLS
- [x] Generated Types
- [x] Reference Data Verification
- [x] Guided Execution Candidates

### Sprint 4 — Recommendation

- [x] Input Normalization
- [x] Category Classification
- [x] Rule Filtering
- [x] Template Scoring
- [x] Candidate Ranking
- [x] Recommendation Persistence
- [x] Rule-based Result UI
- [x] Recommendation Unit Tests
- [x] OpenAI Client
- [x] Responses API
- [x] Structured Explanation
- [x] LLM Fallback
- [ ] Recommendation Enrichment QA
- OpenAI Explanation QA
- [x] Recommendation Observability
- [x] Recommendation Error Recovery
- [ ] Recommendation Creation QA
- Structured Output

### Sprint 5 — Workflow Experience

- [x] Workflow Selection
- [x] Workflow Detail
- [x] Guided Execution Step Checklist (local state)
- [x] Workflow Progress Persistence
- Dashboard
- Project Detail
- Recommendation Results
- Workflow Steps
- Save and Resume

### Sprint 6 — Dashboard

- [x] Dashboard Summary
- [x] Continue Working
- [x] Recent Projects, Recommendations, Activity
- [x] Dashboard Empty State

### Sprint 6 — Guided Execution

- n8n Template Handoff + Setup Guide
- 제한된 Validation 또는 Test
- Usage 기록

### Sprint 7 — Beta Release

- Error States
- Mobile QA
- Security Review
- Legal Pages
- Analytics
- Vercel Production

## Backlog

- Recommendation Revision
- Billing
- Integration Center
- Visual Builder
- Marketplace
- Team
- Plugin System
- Mobile App

## Supabase Status

- Supabase Project: User created
- Supabase Client Foundation: Completed
- Supabase CLI Init: Completed
- Supabase Linked: Completed
- Supabase Schema: Completed
- Sprint 1 Foundation: Completed

## Next Task

S5-002 — Workflow Progress QA and Dashboard Summary

## Operating Rule

Codex는 모든 Task 시작 전에 이 문서와 `docs/05-development-rule.md`를 확인한다.

작업 완료 시 현재 상태, 완료 목록, 다음 Task가 바뀌는 경우에만 이 문서를 수정한다.

내용은 자연스럽게 다듬을 수 있지만 상태와 의미를 바꾸지 않는다.

## 제외 범위

이번 작업에서는 다음을 하지 않는다.

- Next.js 프로젝트 생성
- npm 설치
- Supabase 작업
- GitHub 연결
- Vercel 연결
- UI 구현
- Design Token 확정
- DB 설계
- API 설계
- 기존 기획 문서 수정
- 업로드된 HTML 복사
- 외부 폰트 파일 복사
- Git commit
- Git push

## 검증

작업 후 다음을 실행한다.

```bash
pwd
git status --short
git diff -- docs/05-development-rule.md MASTER_PLAN.md
wc -l docs/05-development-rule.md MASTER_PLAN.md
grep -n "^## " docs/05-development-rule.md
grep -n "^## " MASTER_PLAN.md
```

다른 파일이 수정됐다면 이번 Task와 무관한 변경은 되돌린다.

## 완료 보고

다음 항목만 보고한다.

- 확인한 작업 경로
- 생성 또는 수정한 파일
- 각 문서의 줄 수
- Development Rule 주요 목차
- MASTER_PLAN 현재 Phase와 Sprint
- 반영한 디자인 방향
- 남아 있는 필수 결정
- 다른 파일 수정 여부
- Git commit 및 push 여부

# STABILIZE-003 — Persist Architecture Candidate Selection

기존 `projects.goal_constraints` JSONB에 후보 선택 상태를 저장하고, Project 소유권·후보 무결성·예산·제외 Tool을 서버에서 검증한다. 선택된 Architecture만 Connector, Credential, Build Plan, Installation, Test 입력으로 확정한다.

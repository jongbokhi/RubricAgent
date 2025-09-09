# 루브릭 에이전트 (Rubric Agent)

AI 기반 자동 평가 및 피드백 시스템입니다. LangGraph를 사용하여 교사 입력을 바탕으로 루브릭을 생성하고, 학생 답안을 자동으로 평가하며, 상세한 피드백을 제공합니다.

## ✨ 주요 기능

- 🎯 **자동 루브릭 생성**: 주제, 목적, 학년에 맞는 평가 루브릭 자동 생성
- 📊 **자동 평가**: 학생 답안을 루브릭 기준에 따라 자동 평가
- 💬 **상세 피드백**: 각 평가 기준별 구체적인 피드백 제공
- 📋 **종합 리포트**: 평가 결과를 종합한 리포트 생성
- 🌐 **웹 인터페이스**: 사용자 친화적인 프론트엔드 제공



# Architecture
<img width="1205" height="617" alt="image" src="https://github.com/user-attachments/assets/f4405ca8-84f3-4c3c-b711-1744334fb564" />


## 📁 프로젝트 구조

```
rubric-agent/
├── backend/
│   ├── src/
│   │   ├── main.py          # FastAPI 앱
│   │   ├── rubric.py        # 루브릭 생성 워크플로우
│   │   ├── chains.py        # LangChain 체인
│   │   ├── nodes.py         # LangGraph 노드
│   │   └── state.py         # 상태 정의
│   └── Dockerfile
├── frontend/                # 웹 프론트엔드
│   ├── index.html          # 메인 페이지
│   ├── styles.css          # 스타일시트
│   ├── script.js           # JavaScript
│   ├── Dockerfile          # 프론트엔드 Docker 설정
│   └── nginx.conf          # Nginx 설정
├── docker-compose.yml
├── pyproject.toml
│
rubric-agent-cdk/
```


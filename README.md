# 루브릭 에이전트 (Rubric Agent)

AI 기반 자동 평가 및 피드백 시스템입니다. LangGraph를 사용하여 교사 입력을 바탕으로 루브릭을 생성하고, 학생 답안을 자동으로 평가하며, 상세한 피드백을 제공합니다.

## ✨ 주요 기능

- 🎯 **자동 루브릭 생성**: 주제, 목적, 학년에 맞는 평가 루브릭 자동 생성
- 📊 **자동 평가**: 학생 답안을 루브릭 기준에 따라 자동 평가
- 💬 **상세 피드백**: 각 평가 기준별 구체적인 피드백 제공
- 📋 **종합 리포트**: 평가 결과를 종합한 리포트 생성
- 🌐 **웹 인터페이스**: 사용자 친화적인 프론트엔드 제공

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env` 파일을 생성하고 API 키를 설정합니다:

```bash
# .env 파일 생성
cp example.env .env

# .env 파일에서 API_KEY 설정 (Google Gemini API Key)
```

### 2. Docker 실행

```bash
# 컨테이너 실행
make up

# 또는 백그라운드 실행
make up-d
```

### 3. 웹 인터페이스 접속

- **웹 애플리케이션**: http://localhost:3000 (프론트엔드)
- **API 문서**: http://localhost:8000/docs (백엔드)
- **API 엔드포인트**: http://localhost:8000/api (백엔드)

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
├── Makefile
├── pyproject.toml
└── .env
```

## 🛠️ 명령어

```bash
make build   # Docker 이미지 빌드
make up      # 컨테이너 실행
make down    # 컨테이너 중지
make logs    # 로그 확인
make test    # API 테스트
```

## 🌐 웹 인터페이스 사용법

1. **브라우저에서 http://localhost:3000 접속**
2. **평가 정보 입력**:
   - 주제 (예: 지구 문제에 우리는 어떻게 대처하는가?)
   - 목적 (예: 환경 논제 글쓰기)
   - 학년 선택
   - 학생 이름
   - 학생 답안
3. **"루브릭 생성 및 평가" 버튼 클릭**
4. **결과 확인**:
   - 루브릭: 생성된 평가 기준표
   - 평가: 각 기준별 점수와 평가
   - 피드백: 상세한 개선 제안
   - 리포트: 종합 평가 결과

## 📚 API 사용법

### 루브릭 생성 및 평가

```bash
POST /api/rubric
Content-Type: application/json

{
  "teacher_input": "topic: 지구 문제에 우리는 어떻게 대처하는가?(환경문제)\nobjective: 환경 논제 글쓰기\ngrade_level: 초등학교 6학년\nname: 이종복\nstudent_submission: 학생이 작성한 답안...",
  "thread_id": "unique_thread_id"
}
```

응답:
```json
{
  "status": "success",
  "generated_results": {
    "teacher_input": {...},
    "rubric": "마크다운 형식의 루브릭",
    "evaluation": "평가 결과",
    "feedback": "상세 피드백",
    "report": "종합 리포트"
  }
}
```

## 🔧 로컬 개발

```bash
# 의존성 설치
uv sync

# 서버 실행
uv run uvicorn backend.src.main:app --reload
```

from os import environ
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .rubric import response
import asyncio

app = FastAPI(title="Rubric Agent API", version="1.0.0")

# CORS 설정 - 프론트엔드 컨테이너에서 접근 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend",
    ],  # 프론트엔드 컨테이너 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MY_PROJECT = environ.get("MY_PROJECT", "rubric-agent")
API_KEY = environ.get("API_KEY")

if not API_KEY:
    print("⚠️ Warning: API_KEY is not set")


class RubricRequest(BaseModel):
    teacher_input: str
    thread_id: str


@app.get("/api/health")
def read_root():
    return {"health": "ok", "project": MY_PROJECT}


@app.post("/api/rubric")
async def rubric(request: RubricRequest):
    """교사 입력을 받아 루브릭을 생성합니다."""
    try:
        # rubric.py의 generate_rubric 함수 호출
        generated_results = await response(request.teacher_input, request.thread_id)
        return {"status": "success", "generated_results": generated_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 정적 파일 서빙 제거 - 프론트엔드는 별도 컨테이너에서 처리

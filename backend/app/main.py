from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.schemas import RepoRequest, RepoAnalysisResponse
from app.services.git_service import clone_repo, analyze_repo_structure, cleanup_repo
from app.services.ai_service import generate_multi_mode_docs

load_dotenv()

app = FastAPI(title="RepoDoc AI Backend", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "RepoDoc AI Backend is running smoothly!"}

@app.post("/api/generate-docs", response_model=RepoAnalysisResponse)
async def generate_docs(payload: RepoRequest):
    repo_url = payload.repo_url.strip()
    mode = payload.mode or "readme"
    feedback = payload.user_feedback or ""

    if not repo_url.startswith("https://github.com/"):
        raise HTTPException(status_code=400, detail="Please provide a valid GitHub repository URL.")

    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    temp_dir = None

    try:
        # 1. Clone repository
        temp_dir = clone_repo(repo_url)

        # 2. Analyze files and dependencies with JSON persistence
        analysis = analyze_repo_structure(temp_dir)

        # 3. Generate documentation via LLM based on selected mode & feedback
        doc_content = generate_multi_mode_docs(
            repo_name=repo_name,
            analysis=analysis,
            mode=mode,
            user_feedback=feedback
        )

        return RepoAnalysisResponse(
            repo_name=repo_name,
            file_tree=analysis["file_tree"],
            tech_stack=analysis["tech_stack"],
            env_vars=analysis["env_vars"],
            generated_content=doc_content,
            mode=mode
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temporary cloned files
        if temp_dir:
            cleanup_repo(temp_dir)
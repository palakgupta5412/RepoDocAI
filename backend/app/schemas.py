from pydantic import BaseModel
from typing import List, Optional

class RepoRequest(BaseModel):
    repo_url: str
    mode: Optional[str] = "readme" # readme, user_manual, recommendations
    user_feedback: Optional[str] = ""

class RepoAnalysisResponse(BaseModel):
    repo_name: str
    file_tree: List[str]
    tech_stack: List[str]
    env_vars: List[str]
    ast_symbols: Optional[List[str]] = []
    generated_content: str
    mode: str
import os
import shutil
import tempfile

IGNORED_DIRS = {'.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', '.next'}
ALLOWED_EXTENSIONS = {'.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.md', '.html', '.css'}

def clone_repo(repo_url: str) -> str:
    import git
    temp_dir = tempfile.mkdtemp(prefix="repodoc_")
    try:
        git.Repo.clone_from(repo_url, temp_dir, depth=1)
        return temp_dir
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError(f"Failed to clone repository: {str(e)}")

def analyze_repo_structure(repo_path: str):
    file_tree = []
    tech_stack = set()
    env_vars = []
    code_snippets = []

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), repo_path)
            file_tree.append(rel_path)
            file_path = os.path.join(root, file)
            _, ext = os.path.splitext(file)

            # Detect Tech Stack
            if file == "package.json":
                tech_stack.add("Node.js")
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "express" in content: tech_stack.add("Express.js")
                        if "react" in content: tech_stack.add("React")
                        if "next" in content: tech_stack.add("Next.js")
                        if "tailwindcss" in content: tech_stack.add("Tailwind CSS")
                except: pass

            elif file == "requirements.txt" or file.endswith(".py"):
                tech_stack.add("Python")
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "fastapi" in content.lower(): tech_stack.add("FastAPI")
                        if "flask" in content.lower(): tech_stack.add("Flask")
                        if "langchain" in content.lower(): tech_stack.add("LangChain")
                except: pass

            # Extract Environment Variables
            if "env" in file.lower():
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                env_vars.append(line.split("=")[0].strip())
                except: pass

            # Collect snippets from key configuration or entry files
            if ext in ALLOWED_EXTENSIONS and any(k in file.lower() for k in ['main', 'app', 'index', 'server', 'config', 'routes']):
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        snippet = f.read(1500) # first 1500 chars of key files
                        code_snippets.append(f"--- File: {rel_path} ---\n{snippet}")
                except: pass

    return {
        "file_tree": file_tree[:60],
        "tech_stack": list(tech_stack),
        "env_vars": list(set(env_vars)),
        "code_snippets": code_snippets[:5]
    }

def cleanup_repo(repo_path: str):
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path, ignore_errors=True)
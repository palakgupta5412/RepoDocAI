import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def generate_multi_mode_docs(repo_name: str, analysis: dict, mode: str, user_feedback: str = "") -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment variables.")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.3
    )

    tech_stack = ", ".join(analysis.get("tech_stack", [])) or "General"
    env_vars = ", ".join(analysis.get("env_vars", [])) or "None"
    file_tree = "\n".join(analysis.get("file_tree", []))[:3000]
    snippets = "\n\n".join(analysis.get("code_snippets", []))[:2000]

    if mode == "readme":
        template = """
You are an expert open-source developer. Generate a stunning, professional, GitHub-style README.md for the repository: {repo_name}.
Use clean markdown formatting, badges, emojis, clear headings, and structured sections. Make it look like a top-tier open source project.

Tech Stack: {tech_stack}
Environment Variables Needed: {env_vars}
File Tree:
{file_tree}
Code Context & Entry Points:
{snippets}

Structure required:
1. 🚀 Project Title & Overview (Catchy description)
2. 🌟 Key Features
3. 🛠️ Built With (Tech Stack badges/list)
4. 📁 Project Structure (Directory layout explanation)
5. ⚙️ Installation & Quick Start Guide
6. 🔌 API Endpoints / Core Logic Overview
"""
    elif mode == "user_manual":
        template = """
You are an expert technical mentor. Write a crystal-clear, comprehensive User Manual and Local Setup Guide for {repo_name} from a user/developer's perspective so anyone can run it without confusion.
Use clean markdown with step-by-step numbered instructions and code blocks for terminal commands.

Tech Stack: {tech_stack}
Environment Variables: {env_vars}
File Tree:
{file_tree}

Structure required:
1. 📖 Introduction & Use Case (What this app solves)
2. 📋 Prerequisites & Tools Needed (Node, Python, Git, etc.)
3. 📥 Step 1: Clone the Repository
4. 🔑 Step 2: Configure Environment Variables (.env setup guide)
5. 📦 Step 3: Install Dependencies (Backend & Frontend commands)
6. 🚀 Step 4: Run the Application Locally
7. 🔍 Troubleshooting Common Issues
"""
    else:  # recommendations mode
        template = """
You are a senior software architect and code reviewer. Provide a top-notch Production Audit & Engineering Roadmap for {repo_name}.
Give precise, constructive, and milestone-based feedback to make this project production-ready.

Tech Stack: {tech_stack}
File Tree:
{file_tree}

Structure required:
1. 📊 Executive Code Quality Summary
2. ⚠️ Security, Performance, & Architecture Gaps
3. 💡 Best Practices to Implement
4. 🚀 Step-by-Step Production Deployment Roadmap (Milestone 1, 2, 3)
"""

    if user_feedback:
        template += f"\n\nIMPORTANT USER REVISION/FEEDBACK TO INCORPORATE: {user_feedback}"

    prompt = PromptTemplate(
        input_variables=["repo_name", "tech_stack", "env_vars", "file_tree", "snippets"],
        template=template
    )

    chain = prompt | llm
    response = chain.invoke({
        "repo_name": repo_name,
        "tech_stack": tech_stack,
        "env_vars": env_vars,
        "file_tree": file_tree,
        "snippets": snippets
    })

    content = response.content
    if isinstance(content, list):
        content = "".join([item.get("text", "") if isinstance(item, dict) else str(item) for item in content])

    return str(content)
import os
import uuid
import requests
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, AIMessage
from langgraph.types import Command

from langgraph_core import (
    get_graph,
    get_interrupt_data,
    get_messages as _get_messages,
    get_text,
    ORACLE_BASE_URL,
    ORACLE_PERSON_NUMBER,
    ORACLE_AUTH,
)

app = FastAPI(title="Goal Setting Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic models ---
class ChatRequest(BaseModel):
    thread_id: str
    message: str


class ResumeRequest(BaseModel):
    thread_id: str
    action: str
    goal_data: Optional[dict] = None


# In-memory timestamp cache: msg_id → ISO timestamp string.
# Assigned the first time each message is seen so bubbles show real send times.
_msg_timestamps: dict[str, str] = {}


def _get_or_assign_timestamp(msg_id: str | None) -> str:
    """Return a cached timestamp for msg_id, creating one now if unseen."""
    if not msg_id:
        return datetime.now(timezone.utc).isoformat()
    if msg_id not in _msg_timestamps:
        _msg_timestamps[msg_id] = datetime.now(timezone.utc).isoformat()
    return _msg_timestamps[msg_id]


# --- Helper: serialize messages ---
def serialize_messages(thread_id: str) -> list[dict]:
    raw = _get_messages(thread_id)
    result = []
    for msg in raw:
        msg_id = getattr(msg, "id", None)
        if isinstance(msg, HumanMessage):
            text = msg.content if isinstance(msg.content, str) else ""
            if text:
                result.append({
                    "role": "user",
                    "content": text,
                    "id": msg_id,
                    "timestamp": _get_or_assign_timestamp(msg_id),
                })
        elif isinstance(msg, AIMessage):
            # Skip AI messages that are silent tool triggers — their output is
            # the interrupt card, not a chat bubble.
            tool_call_names = {tc["name"] for tc in getattr(msg, "tool_calls", [])}
            if tool_call_names & {"save_goal", "update_goal"}:
                continue
            text = get_text(msg)
            if text:
                result.append({
                    "role": "assistant",
                    "content": text,
                    "id": msg_id,
                    "timestamp": _get_or_assign_timestamp(msg_id),
                })
    return result


def build_response(thread_id: str) -> dict:
    return {
        "messages": serialize_messages(thread_id),
        "interrupt": get_interrupt_data(thread_id),
    }


# --- Endpoints ---
@app.get("/api/worker")
async def get_worker():
    try:
        url = (
            f"{ORACLE_BASE_URL}/hcmRestApi/resources/11.13.18.05/searchGoals"
            f"?q=PersonNumber={ORACLE_PERSON_NUMBER}&orderBy=GoalId:desc&limit=1"
        )
        resp = requests.get(url, auth=ORACLE_AUTH, timeout=10)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        name = items[0].get("WorkerName", "there") if items else "there"
        return {"name": name}
    except Exception:
        return {"name": "there"}


@app.post("/api/thread/new")
async def new_thread():
    return {"thread_id": str(uuid.uuid4())}


@app.get("/api/messages/{thread_id}")
async def get_thread_messages(thread_id: str):
    return build_response(thread_id)


@app.post("/api/chat")
async def chat(req: ChatRequest):
    graph = get_graph()
    config = {"configurable": {"thread_id": req.thread_id}}
    try:
        # If the graph is paused at an interrupt, silently cancel it before
        # processing the new message — no LLM response is generated for the cancel.
        if get_interrupt_data(req.thread_id):
            graph.invoke(Command(resume={"action": "silent_cancel"}), config)
        graph.invoke(
            {"messages": [HumanMessage(content=req.message)]},
            config,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return build_response(req.thread_id)


@app.post("/api/resume")
async def resume(req: ResumeRequest):
    graph = get_graph()
    config = {"configurable": {"thread_id": req.thread_id}}
    resume_payload = {"action": req.action}
    if req.goal_data:
        resume_payload["goal_data"] = req.goal_data
    try:
        graph.invoke(Command(resume=resume_payload), config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return build_response(req.thread_id)



import os
import uuid
import logging
import requests
from datetime import datetime, timezone
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, HTTPException, Query
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
    ORACLE_AUTH,
    _fetch_goal_progress_pct,
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
    person_number: str


class ResumeRequest(BaseModel):
    thread_id: str
    action: str
    goal_data: Optional[dict] = None
    person_number: Optional[str] = None


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
async def get_worker(person_number: str = Query(...)):
    logger.info("get_worker called with person_number=%r", person_number)
    try:
        url = (
            f"{ORACLE_BASE_URL}/hcmRestApi/resources/11.13.18.05/publicWorkers"
            f"?q=PersonNumber={person_number}&expand=all"
        )
        resp = requests.get(url, auth=ORACLE_AUTH, timeout=10)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        logger.info("publicWorkers returned %d items for person_number=%r", len(items), person_number)
        if items:
            item = items[0]
            name = item.get("DisplayName", "there")
            assignments = item.get("assignments", [])
            primary = next((a for a in assignments if a.get("PrimaryFlag")), assignments[0] if assignments else {})
            designation = primary.get("JobName", "")
        else:
            name = "there"
            designation = ""
        logger.info("resolved worker name: %r, designation: %r", name, designation)
        return {"name": name, "designation": designation}
    except Exception as e:
        logger.error("get_worker error for person_number=%r: %s", person_number, e)
        return {"name": "there", "designation": ""}


@app.post("/api/thread/new")
async def new_thread():
    return {"thread_id": str(uuid.uuid4())}


@app.get("/api/goal-progress/{goal_id}")
async def get_goal_progress(goal_id: int):
    pct = _fetch_goal_progress_pct(goal_id)
    return {"GoalId": goal_id, "PercentCompletion": pct if pct is not None else 0}


@app.get("/api/messages/{thread_id}")
async def get_thread_messages(thread_id: str):
    return build_response(thread_id)


@app.post("/api/chat")
async def chat(req: ChatRequest):
    logger.info("chat: thread=%s person_number=%r message=%r", req.thread_id[:8], req.person_number, req.message[:60])
    graph = get_graph()
    config = {"configurable": {"thread_id": req.thread_id}}
    try:
        # If the graph is paused at an interrupt, silently cancel it before
        # processing the new message — no LLM response is generated for the cancel.
        if get_interrupt_data(req.thread_id):
            graph.invoke(Command(resume={"action": "silent_cancel"}), config)
        graph.invoke(
            # person_number is included so MemorySaver persists it in state for
            # all subsequent tool calls on this thread.
            {"messages": [HumanMessage(content=req.message)], "person_number": req.person_number},
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
        logger.exception("resume error: thread=%s action=%s", req.thread_id, req.action)
        raise HTTPException(status_code=500, detail=str(e))
    return build_response(req.thread_id)

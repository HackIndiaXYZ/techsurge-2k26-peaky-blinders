"""Simulated message sources for the prototype.

A real deployment would receive messages from an OS-level integration or a
partner messaging platform calling POST /api/analyze-message. Until then the
frontend messenger loads these fixed, clearly synthetic threads.
"""

import json
from functools import lru_cache

from fastapi import APIRouter

from config import BACKEND_DIR
from schemas import ConversationOut

router = APIRouter(tags=["simulator"])


@lru_cache(maxsize=1)
def _load_conversations() -> list[ConversationOut]:
    path = BACKEND_DIR / "data" / "demo_conversations.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for conv in payload["conversations"]:
        last = conv["messages"][-1]["text"]
        out.append(ConversationOut(preview=last if len(last) <= 72 else last[:69] + "…", **conv))
    return out


@router.get("/conversations", response_model=list[ConversationOut])
def conversations() -> list[ConversationOut]:
    return _load_conversations()

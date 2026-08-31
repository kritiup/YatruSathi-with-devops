"""
YatruSathi AI Chatbot Server
Flask + Flask-SocketIO server providing:
  - REST endpoint: POST /api/chat  (AI reply with RAG)
  - WebSocket:     Socket.IO events for real-time group chat rooms
"""
from flask import Flask, request, jsonify, render_template, Response, stream_with_context
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
from chatbot import get_bot_reply, clear_session, stream_bot_reply
from supabase import create_client
from dotenv import load_dotenv
import os
import json
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "yatrusathi-secret-2024")

CORS(app, origins="*")

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    logger=False,
    engineio_logger=False,
)

# ── Supabase client ───────────────────────────────────────────────────────────
_supabase = None
try:
    _supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    logger.info("Supabase client initialized")
except Exception as e:
    logger.warning(f"Supabase init failed (non-fatal): {e}")


def _log_to_supabase(session_id: str, user_msg: str, bot_reply: str):
    """Non-blocking Supabase log insert."""
    if _supabase is None:
        return
    try:
        _supabase.table("chatbot_logs").insert({
            "session_id": session_id,
            "user_message": user_msg,
            "bot_reply": bot_reply,
        }).execute()
    except Exception:
        pass


# ── REST Endpoints ────────────────────────────────────────────────────────────

@app.route("/")
def home():
    try:
        return render_template("index.html")
    except Exception:
        return jsonify({"status": "YatruSathi AI running", "docs": "/api/chat"})


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "yatrusathi-ai"})


@app.route("/get")
def chat_get():
    user_text = request.args.get("msg", "")
    reply = get_bot_reply(user_text)
    return jsonify({"reply": reply})


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Primary chat endpoint.
    Body: {
        "message": str,
        "session_id": str (optional),
        "event_context": {
            "destination": str,
            "date": str,
            "group_size": int,
            "budget": str
        }
    }
    """
    data = request.get_json(silent=True) or {}
    user_text = data.get("message", "").strip()
    if not user_text:
        return jsonify({"error": "No message provided"}), 400

    session_id    = data.get("session_id", "default")
    event_context = data.get("event_context")

    reply = get_bot_reply(
        user_message=user_text,
        session_id=session_id,
        event_context=event_context,
    )

    _log_to_supabase(session_id, user_text, reply)
    return jsonify({"reply": reply, "session_id": session_id})


@app.route("/api/session/<session_id>", methods=["DELETE"])
def clear_chat_session(session_id: str):
    """Clear conversation memory for a session."""
    clear_session(session_id)
    return jsonify({"cleared": session_id})


@app.route("/api/chat/stream", methods=["POST"])
def api_chat_stream():
    """
    Streaming SSE endpoint.
    The browser receives tokens in real-time via Server-Sent Events.
    Body: same as /api/chat
    """
    data = request.get_json(silent=True) or {}
    user_text = data.get("message", "").strip()
    if not user_text:
        return jsonify({"error": "No message provided"}), 400

    session_id    = data.get("session_id", "default")
    event_context = data.get("event_context")

    def generate():
        full_reply_parts = []
        try:
            for token in stream_bot_reply(user_text, session_id, event_context):
                full_reply_parts.append(token)
                payload = json.dumps({"token": token})
                yield f"data: {payload}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            full_reply = "".join(full_reply_parts)
            _log_to_supabase(session_id, user_text, full_reply)
            yield f"data: {json.dumps({'done': True})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ── Socket.IO — Real-time Group Chat ─────────────────────────────────────────

@socketio.on("join_group")
def on_join(data):
    """Client joins a group chat room."""
    room     = str(data.get("group_id", "general"))
    username = data.get("username", "Anonymous")
    join_room(room)
    emit("system_message", {
        "text": f"{username} joined the group chat.",
        "type": "join"
    }, to=room)
    logger.info(f"[socket] {username} joined room {room}")


@socketio.on("leave_group")
def on_leave(data):
    """Client leaves a group chat room."""
    room     = str(data.get("group_id", "general"))
    username = data.get("username", "Anonymous")
    leave_room(room)
    emit("system_message", {
        "text": f"{username} left the group chat.",
        "type": "leave"
    }, to=room)


@socketio.on("group_message")
def on_group_message(data):
    """
    Broadcast a user message to the group room.
    If message starts with '@ai' or '@yatrusathi', also generate an AI response.
    """
    room          = str(data.get("group_id", "general"))
    username      = data.get("username", "User")
    message       = data.get("message", "").strip()
    event_context = data.get("event_context")

    if not message:
        return

    emit("new_message", {
        "sender":    username,
        "text":      message,
        "type":      "user",
        "timestamp": _now()
    }, to=room)

    lower_msg = message.lower()
    ai_triggers = ["@ai", "@yatrusathi", "ai help", "hey ai"]
    if any(t in lower_msg for t in ai_triggers):
        clean_msg = message
        for t in ai_triggers:
            clean_msg = clean_msg.replace(t, "").replace(t.upper(), "").strip()

        session_id = f"group_{room}"
        reply = get_bot_reply(
            user_message=clean_msg or message,
            session_id=session_id,
            event_context=event_context,
        )

        emit("new_message", {
            "sender":    "YatruSathi AI 🧳",
            "text":      reply,
            "type":      "ai",
            "timestamp": _now()
        }, to=room)

        _log_to_supabase(session_id, message, reply)


@socketio.on("ask_ai")
def on_ask_ai(data):
    """Direct AI question from a group member — broadcasts answer to whole room."""
    room          = str(data.get("group_id", "general"))
    message       = data.get("message", "").strip()
    event_context = data.get("event_context")
    session_id    = f"group_{room}"

    if not message:
        return

    reply = get_bot_reply(
        user_message=message,
        session_id=session_id,
        event_context=event_context,
    )

    emit("ai_reply", {
        "question":  message,
        "answer":    reply,
        "timestamp": _now()
    }, to=room)

    _log_to_supabase(session_id, message, reply)


def _now() -> str:
    from datetime import datetime
    return datetime.now().strftime("%H:%M")


if __name__ == "__main__":
    socketio.run(app, debug=True, port=5005, allow_unsafe_werkzeug=True)

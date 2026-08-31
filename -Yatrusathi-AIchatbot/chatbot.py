"""
YatruSathi Chatbot — v2  (Groq-powered, blazing fast)
Primary: Groq Cloud (free tier, Llama 3.3 70B ~500 tok/s)
Fallback: Template-based response using knowledge base directly
"""
import os
import re
import logging
from collections import defaultdict
from typing import Optional, Dict, Generator

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Knowledge Base ────────────────────────────────────────────────────────────
from knowledge_base import (
    search as kb_search,
    get_stats as kb_stats,
    build_travel_response,
    _is_travel_related,
    _extract_districts_from_query,
    _fuzzy_match_district,
)

# ── Groq client ──────────────────────────────────────────────────────────────
_groq_client = None
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

try:
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key:
        _groq_client = Groq(api_key=api_key)
        logger.info(f"Groq client ready — model: {GROQ_MODEL}")
    else:
        logger.warning("GROQ_API_KEY not set — chatbot will use template fallback")
except ImportError:
    logger.warning("groq package not installed — pip install groq")


# ── Session memory (in-process, lightweight) ─────────────────────────────────
_sessions: Dict[str, list] = defaultdict(list)
_MAX_HISTORY = 10  # keep last N exchanges per session


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""You are **YatruSathi** (यात्रुसाथी) — a friendly, knowledgeable Nepal travel companion AI.

## YOUR CORE RULES:
1. **DATA FIRST**: You will receive curated travel data and local survey insights. These are your PRIMARY source. ALWAYS weave them naturally into your answers — cite specific foods, places, cultural events, and tips from the data.
2. **Be specific**: When a user asks about a district/city, mention EXACT names of foods, places, cultural events from the data. NEVER give vague answers like "there are many places".
3. **District-focused**: If the user mentions a location, focus your answer on THAT specific district/region. Do not give generic Nepal-wide answers.
4. **Organized format**: Structure answers with clear categories — 🍽️ Food, 📍 Places, 🎭 Culture/Festivals, ⚠️ Tips — when appropriate. Use bullet points and bold for readability.
5. **If no data exists**: Say honestly "I don't have detailed data for [place] yet, but here's what I know..." and give brief general info.
6. **Language**: Respond in the SAME language the user writes in (English or Nepali). Default to English.
7. **Concise but helpful**: Keep answers informative but not overwhelming — max 3-5 items per category.
8. **Nepal only**: You are specifically about Nepal travel. Politely redirect off-topic questions.
9. **Practical**: Include practical tips (costs in NPR, best seasons, how to get there) when available.
10. **Warm tone**: Be enthusiastic about Nepal's hidden gems. Use occasional Nepali words naturally.
11. **Never expose raw data labels**: Do NOT mention "survey data", "CSV data", "verified data", or data source labels. Present information naturally as if you know it.

## KNOWLEDGE BASE: {kb_stats()}

When you receive context data, ALWAYS weave it naturally into your response as a knowledgeable local guide would. Never dump raw data."""


def _build_messages(user_message: str, session_id: str, event_context: Optional[Dict] = None) -> list:
    """Build the messages array for the LLM call."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history
    history = _sessions.get(session_id, [])
    for entry in history[-_MAX_HISTORY:]:
        messages.append(entry)

    # Build user message with context
    context = kb_search(user_message)

    user_content = ""
    if event_context:
        parts = []
        if event_context.get("destination"):
            parts.append(f"Destination: {event_context['destination']}")
        if event_context.get("date"):
            parts.append(f"Travel date: {event_context['date']}")
        if event_context.get("group_size"):
            parts.append(f"Group size: {event_context['group_size']}")
        if event_context.get("budget"):
            parts.append(f"Budget: {event_context['budget']}")
        if parts:
            user_content += "[EVENT CONTEXT]\n" + "\n".join(parts) + "\n\n"

    user_content += f"[KNOWLEDGE BASE RESULTS]\n{context}\n\n[USER QUESTION]\n{user_message}"

    messages.append({"role": "user", "content": user_content})
    return messages


def _classify_intent(msg: str) -> str:
    """Classify the user's message intent."""
    m = msg.strip().lower()
    words = set(re.findall(r'\b\w+\b', m))

    # Greeting
    greetings = {"hi", "hello", "namaste", "hey", "hola", "yo", "sup", "namaskar",
                 "howdy", "greetings"}
    if words & greetings and len(words) <= 5:
        return "greeting"

    # Farewell
    farewells = {"bye", "goodbye", "thanks", "thank", "thankyou", "dhanyabad", "seeya"}
    if words & farewells:
        return "farewell"

    # Help
    if "help" in words or "can you" in m or "what can" in m or "what do you" in m \
       or "how do i" in m or "guide me" in m or "how does this" in m:
        return "help"

    # About self / meta questions
    if "who are you" in m or "what are you" in m or "your name" in m:
        return "about"

    # Travel-related
    if _is_travel_related(msg):
        return "travel"

    # Fallback: unknown
    return "unknown"


def _template_fallback(user_message: str, event_context: Optional[Dict] = None) -> str:
    """When Groq is unavailable, generate a smart response based on intent classification."""
    msg = user_message.strip()
    intent = _classify_intent(msg)

    # -- Greeting --
    if intent == "greeting":
        return (
            "Namaste! 🙏 Welcome to YatruSathi, your friendly Nepal travel companion.\n\n"
            "I can help you with:\n\n"
            "- 🍽️ **Local food and restaurants** - what to eat and where\n"
            "- 🏔️ **Places to visit** - hidden gems, popular spots, treks\n"
            "- 🎭 **Culture and festivals** - traditions, events, local customs\n"
            "- 💡 **Practical tips** - transport, permits, costs, best seasons\n\n"
            "Just ask me something like *'What should I eat in Kathmandu?'* or "
            "*'Best places to visit in Pokhara'* and I'll get you the best recommendations!"
        )

    # -- Farewell --
    if intent == "farewell":
        return (
            "Thank you for using YatruSathi! 🙏\n\n"
            "Have a wonderful trip to Nepal! Feel free to come back anytime "
            "if you need more travel recommendations. Safe travels! 🏔️"
        )

    # -- Help / How-to --
    if intent == "help":
        return (
            "I'm YatruSathi 🙏, your Nepal travel assistant!\n\n"
            "Here's what I can help with:\n\n"
            "- Ask about any of **Nepal's 77 districts** - food, places, culture, tips\n"
            "- Get recommendations for treks *(Everest, Annapurna, Langtang, Poon Hill...)*\n"
            "- Learn about festivals *(Dashain, Tihar, Holi, Tiji...)*\n"
            "- Get practical travel tips - permits, costs, transport, weather\n\n"
            "**Examples:**\n\n"
            "- Tell me about Mustang\n"
            "- What's the best food in Pokhara?\n"
            "- Top treks in Nepal\n"
            "- Places to visit in Chitwan"
        )

    # -- About self --
    if intent == "about":
        return (
            "I'm YatruSathi (यात्रुसाथी) 🙏, your AI-powered Nepal travel companion.\n\n"
            "I have detailed knowledge of all 77 districts of Nepal, from popular "
            "tourist spots like Kathmandu and Pokhara to hidden gems like Bandipur and Ilam.\n\n"
            "Ask me anything about Nepal travel and I'll do my best to help!"
        )

    # ── Travel query ──
    if intent == "travel":
        pretty = build_travel_response(user_message)

        if pretty:
            # Add event context if present
            context_note = ""
            if event_context:
                parts = []
                if event_context.get("destination"):
                    parts.append(f"destination: **{event_context['destination']}**")
                if event_context.get("date"):
                    parts.append(f"travel date: **{event_context['date']}**")
                if event_context.get("group_size"):
                    parts.append(f"group of **{event_context['group_size']}**")
                if parts:
                    context_note = f"*Based on your trip details: {', '.join(parts)}*\n\n"

            return (context_note + pretty) if context_note else pretty

        # Travel-related but couldn't find specific data
        # Check if there's a fuzzy match we can suggest
        words = re.findall(r'\b[a-z]{4,}\b', msg.lower())
        suggestions = []
        for w in words:
            match = _fuzzy_match_district(w)
            if match:
                suggestions.append(match.title())

        if suggestions:
            return (
                f"I think you might be asking about {', '.join(suggestions)}? 🤔\n\n"
                f"Try asking: 'Tell me about {suggestions[0]}' for detailed recommendations!"
            )

        return (
            "I'd love to help, but I need a bit more detail! 🤔\n\n"
            "Could you tell me:\n\n"
            "- Which district or city you're interested in?\n"
            "- What you'd like to know - food, places, treks, or culture?\n\n"
            "**Popular choices:**\n\n"
            "- Tell me about Kathmandu - temples, food, nightlife\n"
            "- Best food in Pokhara - lakeside eats and Thakali cuisine\n"
            "- Top treks in Nepal - Everest, Annapurna, Poon Hill\n"
            "- What's special about Mustang? - the hidden Tibetan kingdom"
        )

    # -- Unknown / nonsensical --
    return (
        "I'm YatruSathi, a Nepal travel assistant 🙏\n\n"
        "I can only help with Nepal travel-related questions like:\n\n"
        "- What should I eat in Kathmandu?\n"
        "- Best places to visit in Pokhara\n"
        "- Tell me about Mustang\n"
        "- Top treks in Nepal\n\n"
        "Please ask me something about Nepal travel and I'll be happy to help! 😊"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API — matches what app.py imports
# ══════════════════════════════════════════════════════════════════════════════

def get_bot_reply(
    user_message: str,
    session_id: str = "default",
    event_context: Optional[Dict] = None,
) -> str:
    """Return a complete reply string."""
    if not user_message.strip():
        return "Please type a message so I can help you! 😊"

    # Try Groq first
    if _groq_client:
        try:
            messages = _build_messages(user_message, session_id, event_context)
            response = _groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                top_p=0.9,
            )
            reply = response.choices[0].message.content.strip()

            # Save to session
            _sessions[session_id].append({"role": "user", "content": user_message})
            _sessions[session_id].append({"role": "assistant", "content": reply})
            # Trim history
            if len(_sessions[session_id]) > _MAX_HISTORY * 2:
                _sessions[session_id] = _sessions[session_id][-_MAX_HISTORY * 2:]

            return reply
        except Exception as e:
            logger.error(f"Groq error: {e}")

    # Fallback: template response from KB data
    return _template_fallback(user_message, event_context)


def stream_bot_reply(
    user_message: str,
    session_id: str = "default",
    event_context: Optional[Dict] = None,
) -> Generator[str, None, None]:
    """Yield tokens as they stream from Groq."""
    if not user_message.strip():
        yield "Please type a message so I can help you! 😊"
        return

    if _groq_client:
        try:
            messages = _build_messages(user_message, session_id, event_context)
            stream = _groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                top_p=0.9,
                stream=True,
            )

            full_parts = []
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    full_parts.append(delta.content)
                    yield delta.content

            full_reply = "".join(full_parts)
            # Save to session
            _sessions[session_id].append({"role": "user", "content": user_message})
            _sessions[session_id].append({"role": "assistant", "content": full_reply})
            if len(_sessions[session_id]) > _MAX_HISTORY * 2:
                _sessions[session_id] = _sessions[session_id][-_MAX_HISTORY * 2:]
            return
        except Exception as e:
            logger.error(f"Groq stream error: {e}")

    # Fallback: yield the whole template response at once
    reply = _template_fallback(user_message, event_context)
    yield reply


def clear_session(session_id: str = "default") -> None:
    """Clear conversation history for a session."""
    _sessions.pop(session_id, None)


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys; sys.stdout.reconfigure(encoding="utf-8")
    print(f"KB loaded: {kb_stats()}")
    print(f"Groq client: {'✅ ready' if _groq_client else '❌ not configured (set GROQ_API_KEY)'}")
    print()

    test_queries = [
        "Tell me about food in Kathmandu",
        "What are the best places to visit in Pokhara?",
        "Hidden gems in Parbat district",
        "Namaste! What can you help with?",
    ]
    for q in test_queries:
        print(f"Q: {q}")
        reply = get_bot_reply(q)
        print(f"A: {reply[:300]}...\n")

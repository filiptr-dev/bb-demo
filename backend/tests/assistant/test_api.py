"""The chat endpoint's free-text path (the agent with a scripted model), errors, limits and feedback."""

import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.modules.assistant.deps import get_llm_client
from app.modules.assistant.llm.agent import MAX_TOOL_CALLS
from app.modules.assistant.llm.client import LlmRequest, ToolResults, UserTurn
from tests.assistant.conftest import assistant_app, one, rows, stream, text_of, types_of
from tests.assistant.fakes import FakeLlm, Reply, answer, calls

FOOTER = "[[confidence:v1 score=88 status=supported reason=From the catalog]]"


def last_answer(db: str) -> tuple[Any, ...]:
    [row] = rows(
        db,
        "select content, model, tool_calls, events from assistant_messages where role = 'assistant'"
        " order by created_at desc limit 1",
    )
    return row


def test_answer_with_a_tool(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    llm.replies += [
        calls(("search_products", {"query": "6205", "limit": 3})),
        answer(
            "The **6205** is a deep groove ball bearing, ",
            "25 x 52 x 15 mm.\n\n[",
            "[confidence:v1 score=88 ",
            "status=supported reason=From the catalog]]\n[[suggestions:v1 ",
            "How often should I regrease a 6205? | What is the 6205-2RSH?]]",
        ),
    ]
    events = stream(chat_client, message="What is the 6205?", locale="en")

    assert types_of(events) == ["status", "status", "text", "text", "products", "confidence", "suggestions", "done"]
    assert [e["status"] for e in events[:2]] == ["thinking", "searching"]
    assert text_of(events) == "The **6205** is a deep groove ball bearing, 25 x 52 x 15 mm.\n\n"
    assert [p["designation"] for p in one(events, "products")["products"]] == ["6205"]
    assert one(events, "confidence") == {
        "type": "confidence",
        "score": 88,
        "status": "supported",
        "reason": "From the catalog",
    }
    assert one(events, "suggestions")["suggestions"] == [
        "How often should I regrease a 6205?",
        "What is the 6205-2RSH?",
    ]

    # the second request carried the tool result back to the model
    second = llm.requests[1][1]
    assert isinstance(second.turns[0], UserTurn)
    assert second.turns[0].text == "What is the 6205?"
    results = second.turns[-1]
    assert isinstance(results, ToolResults)
    [(name, result)] = results.results
    assert name == "search_products"
    assert result["total"] >= 1
    assert result["products"][0]["url"] == "/catalog/6205"
    assert "Site language: English." in second.system

    content, model, tool_calls, saved = last_answer(catalog_db)
    assert content == "The **6205** is a deep groove ball bearing, 25 x 52 x 15 mm."
    assert (model, tool_calls) == ("lite", 1)
    assert [e["type"] for e in saved] == types_of(events)[:-1]  # the stream as sent, without done


@pytest.mark.usefixtures("specs_db")
def test_specs_answer_lists_the_skf_page(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies += [calls(("get_product", {"designation": "6205"})), answer(f"**6205**: C = 14.8 kN. {FOOTER}")]
    events = stream(chat_client, message="load rating of 6205?")
    [source] = one(events, "sources")["sources"]
    assert source["title"] == "SKF 6205"
    assert source["url"].startswith("https://www.skf.com/")
    assert [e["status"] for e in events if e["type"] == "status"] == ["thinking", "searching"]


def test_tool_errors_go_back_to_the_model(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies += [
        calls(("get_product", {"designation": "NOPE-123"}), ("no_such_tool", {}), ("rating_life", {"rpm": -1})),
        answer("I couldn't find that product."),
    ]
    events = stream(chat_client, message="specs of NOPE-123")
    results = llm.requests[1][1].turns[-1]
    assert isinstance(results, ToolResults)
    assert [r["error"] for _, r in results.results] == ["product_not_found", "unknown_tool", "invalid_arguments"]
    assert "confidence" not in types_of(events)  # no footer: no confidence event
    assert "products" not in types_of(events)


def test_the_tool_budget_ends_with_an_answer(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    def script(request: LlmRequest) -> Reply:
        if request.allow_tools:
            return calls(("decode_designation", {"designation": "6205"}), ("grease_guide", {}), ("grease_guide", {}))
        return answer("Done looking.")

    llm.script = script
    events = stream(chat_client, message="tell me everything")
    assert text_of(events) == "Done looking."
    assert len([e for e in events if e["type"] == "status"]) == 1 + MAX_TOOL_CALLS
    assert [r.allow_tools for _, r in llm.requests] == [True, True, True, False]  # 3 + 3 + 2 calls, then answer
    assert last_answer(catalog_db)[2] == MAX_TOOL_CALLS


def test_history_goes_to_the_model(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies += [answer(f"Hello! {FOOTER}"), answer("The 6206.")]
    conversation = stream(chat_client, message="hi")[-1]["conversationId"]
    stream(chat_client, conversationId=conversation, message="and the next size up?")
    turns = llm.requests[1][1].turns
    assert [(type(t).__name__, getattr(t, "text", None)) for t in turns] == [
        ("UserTurn", "hi"),
        ("ModelTurn", "Hello!"),  # saved without the footer
        ("UserTurn", "and the next size up?"),
    ]


def test_falls_back_to_the_second_model(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    llm.down = ("lite",)
    llm.replies.append(answer("From the fallback."))
    events = stream(chat_client, message="hi")
    assert text_of(events) == "From the fallback."
    assert last_answer(catalog_db)[1] == "flash"


def test_every_model_down(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    llm.down = ("lite", "flash")
    events = stream(chat_client, message="hi")
    assert types_of(events) == ["status", "error", "done"]
    assert events[1]["code"] == "assistant_unavailable"
    assert last_answer(catalog_db)[3][-1]["code"] == "assistant_unavailable"  # the failed turn is kept


def test_empty_answer(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies.append(answer(FOOTER))  # only the footer: nothing to show
    events = stream(chat_client, message="hi")
    assert one(events, "error")["code"] == "assistant_failed"


def test_a_broken_model_call(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies.append(RuntimeError("boom"))
    events = stream(chat_client, message="hi")
    assert types_of(events)[-2:] == ["error", "done"]
    assert one(events, "error")["code"] == "assistant_failed"


def test_without_a_model(chat_client: TestClient, llm: FakeLlm) -> None:
    chat_client.app.dependency_overrides[get_llm_client] = lambda: None  # type: ignore[attr-defined]
    events = stream(chat_client, message="hi")
    assert types_of(events) == ["error", "done"]
    assert events[0]["code"] == "assistant_unavailable"
    events = stream(chat_client, preset="where_to_buy")  # the flows still work
    assert types_of(events) == ["contact", "done"]


def test_daily_limit(catalog_db: str) -> None:
    app = assistant_app(catalog_db, assistant_daily_limit=1)
    fake = FakeLlm(answer("one"), answer("two"))
    app.dependency_overrides[get_llm_client] = lambda: fake
    with TestClient(app) as client:
        assert text_of(stream(client, message="hi")) == "one"
        events = stream(client, message="hi again")
        assert one(events, "error")["code"] == "assistant_busy"
        assert types_of(stream(client, preset="where_to_buy")) == ["contact", "done"]  # flows don't count


def test_unknown_conversation(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    events = stream(chat_client, conversationId=str(uuid.uuid4()), message="hi")
    assert events == [{"type": "error", "code": "conversation_not_found", "detail": "Start a new conversation."}]
    assert rows(catalog_db, "select count(*) from assistant_messages") == [(0,)]


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"message": "   "},
        {"message": "x" * 2001},
        {"preset": "weather"},
        {"message": "hi", "conversationId": "not-a-uuid"},
        {"message": "hi", "locale": "x" * 9},
    ],
)
def test_invalid_requests(chat_client: TestClient, body: dict[str, Any]) -> None:
    res = chat_client.post("/api/v1/assistant/chat", json=body)
    assert (res.status_code, res.json()["code"]) == (422, "validation_failed")


def test_rate_limit(catalog_db: str) -> None:
    with TestClient(assistant_app(catalog_db, assistant_rate_limit=2)) as client:
        for _ in range(2):
            assert client.post("/api/v1/assistant/chat", json={"preset": "where_to_buy"}).status_code == 200
        res = client.post("/api/v1/assistant/chat", json={"preset": "where_to_buy"})
        assert (res.status_code, res.json()["code"]) == (429, "rate_limited")
        assert res.headers["content-type"].startswith("application/problem+json")
        assert 1 <= int(res.headers["retry-after"]) <= 600
    [(key, hits)] = rows(catalog_db, "select key, hits from rate_limits")
    assert key.startswith("assistant:")
    assert "testclient" not in key
    assert hits == 3


def test_feedback(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    done = stream(chat_client, preset="where_to_buy")[-1]
    body = {"messageId": done["messageId"], "rating": "down", "reason": "incorrect", "comment": "wrong phone"}
    assert chat_client.post("/api/v1/assistant/feedback", json=body).status_code == 204
    body = {"messageId": done["messageId"], "rating": "up"}
    assert chat_client.post("/api/v1/assistant/feedback", json=body).status_code == 204  # replaces it
    assert rows(catalog_db, "select rating, reason, comment from assistant_feedback") == [("up", None, None)]

    [(question,)] = rows(catalog_db, "select id from assistant_messages where role = 'user'")
    for message_id in (str(question), str(uuid.uuid4())):
        res = chat_client.post("/api/v1/assistant/feedback", json={"messageId": message_id, "rating": "up"})
        assert (res.status_code, res.json()["code"]) == (404, "message_not_found")

    res = chat_client.post("/api/v1/assistant/feedback", json={"messageId": done["messageId"], "rating": "meh"})
    assert (res.status_code, res.json()["code"]) == (422, "validation_failed")


def test_openapi_documents_the_stream(chat_client: TestClient) -> None:
    doc = chat_client.get("/openapi.json").json()
    chat = doc["paths"]["/api/v1/assistant/chat"]["post"]
    assert "429" in chat["responses"]
    event = chat["responses"]["200"]["content"]["application/jsonl"]["itemSchema"]
    assert set(event["discriminator"]["mapping"]) == {
        "status",
        "text",
        "products",
        "ask",
        "specs",
        "decode",
        "greases",
        "contact",
        "sources",
        "confidence",
        "suggestions",
        "error",
        "done",
    }

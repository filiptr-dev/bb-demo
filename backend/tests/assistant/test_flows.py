"""Starter prompts: answered from catalog data, no model involved (the fake model has no replies queued, so any call
to it would fail the test)."""

import uuid

import pytest
from fastapi.testclient import TestClient

from tests.assistant.conftest import one, rows, stream, types_of
from tests.assistant.fakes import FakeLlm, answer


def pending_flow(db: str, conversation_id: str) -> str | None:
    [(flow,)] = rows(db, "select pending_flow from assistant_conversations where id = %s", uuid.UUID(conversation_id))
    return flow  # type: ignore[no-any-return]


def test_product_search_asks_then_searches(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    events = stream(chat_client, preset="product_search", locale="en")
    assert types_of(events) == ["ask", "done"]
    assert events[0]["ask"] == "product_query"
    conversation = events[-1]["conversationId"]
    assert pending_flow(catalog_db, conversation) == "product_search"

    events = stream(chat_client, conversationId=conversation, message="25x52x15")
    assert types_of(events) == ["products", "done"]
    found = events[0]
    assert (found["search"], len(found["products"])) == ("25x52x15", 5)
    assert found["total"] > 5
    assert {(p["d"], p["D"], p["B"]) for p in found["products"]} == {(25, 52, 15)}
    assert pending_flow(catalog_db, conversation) is None
    assert llm.requests == []


def test_preset_with_its_own_text(chat_client: TestClient, llm: FakeLlm) -> None:
    events = stream(chat_client, preset="product_search", message="6205-2RSH")
    found = one(events, "products")
    assert found["search"] == "6205-2RSH"
    assert found["products"][0]["designation"].startswith("6205-2RSH")
    assert types_of(events)[-1] == "done"


def test_product_search_hands_a_sentence_to_the_model(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    conversation = stream(chat_client, preset="product_search")[-1]["conversationId"]
    llm.replies.append(answer("Try **6205**. [[confidence:v1 score=60 status=partial reason=guess]]"))
    events = stream(chat_client, conversationId=conversation, message="something quiet for an electric motor?")
    assert "text" in types_of(events)
    assert len(llm.requests) == 1
    assert pending_flow(catalog_db, conversation) is None


@pytest.mark.usefixtures("specs_db")
def test_datasheet(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    events = stream(chat_client, preset="datasheet")
    assert events[0] == {"type": "ask", "ask": "designation"}
    conversation = events[-1]["conversationId"]

    events = stream(chat_client, conversationId=conversation, message="data for 6205 please")
    specs = one(events, "specs")
    assert specs["product"]["designation"] == "6205"
    assert specs["specs"]["c"] == 14.8
    [(summary,)] = rows(
        catalog_db, "select content from assistant_messages where role = 'assistant' order by created_at desc limit 1"
    )
    assert "C 14.8 kN" in summary  # what the model sees of this answer later


@pytest.mark.usefixtures("specs_db")
def test_datasheet_without_skf_data(chat_client: TestClient, llm: FakeLlm) -> None:
    events = stream(chat_client, preset="datasheet", message="6205-2RS1")
    specs = one(events, "specs")
    assert (specs["product"]["designation"], specs["specs"]) == ("6205-2RS1", None)


def test_decode(chat_client: TestClient, llm: FakeLlm) -> None:
    events = stream(chat_client, preset="decode", message="what is 6205-2RSH/C3?")
    decoded = one(events, "decode")["decoded"]
    assert [s["token"] for s in decoded["segments"]] == ["62", "05", "2RSH", "C3"]


def test_decode_hands_a_suffix_question_to_the_model(chat_client: TestClient, llm: FakeLlm) -> None:
    llm.replies.append(answer("**C3** is a radial internal clearance greater than normal."))
    events = stream(chat_client, preset="decode", message="what does C3 mean?")
    assert "decode" not in types_of(events)
    assert len(llm.requests) == 1


def test_grease_shows_the_basics_then_the_model_answers(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    events = stream(chat_client, preset="grease")
    assert types_of(events) == ["greases", "ask", "done"]
    assert events[0]["basic"][0] == {"condition": "allPurpose", "code": "LGMT 2"}
    conversation = events[-1]["conversationId"]
    assert pending_flow(catalog_db, conversation) == "grease"

    llm.replies.append(answer("Use **LGHP 2**. [[confidence:v1 score=80 status=supported reason=chart]]"))
    events = stream(chat_client, conversationId=conversation, message="120 °C, electric motor, 3000 rpm")
    assert "Use **LGHP 2**." in "".join(e.get("text", "") for e in events)
    assert pending_flow(catalog_db, conversation) is None
    # the model saw the flow's summary as the previous answer
    turns = llm.requests[0][1].turns
    assert "basic SKF grease selection" in getattr(turns[1], "text", "")


def test_where_to_buy(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    events = stream(chat_client, preset="where_to_buy", locale="mk")
    assert types_of(events) == ["contact", "done"]
    assert pending_flow(catalog_db, events[-1]["conversationId"]) is None
    [(role, preset), (role2, flow)] = rows(
        catalog_db, "select role, coalesce(preset, flow) from assistant_messages order by created_at"
    )
    assert (role, preset, role2, flow) == ("user", "where_to_buy", "assistant", "where_to_buy")

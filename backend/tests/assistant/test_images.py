"""Photos sent with a chat message: validated, passed to the model as they are, never stored."""

import base64

import pytest
from fastapi.testclient import TestClient

from app.modules.assistant.llm.client import Image, UserTurn
from tests.assistant.conftest import rows, stream, text_of
from tests.assistant.fakes import FakeLlm, answer

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 60
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 60
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 60


def image(data: bytes, mime_type: str = "image/jpeg") -> dict[str, str]:
    return {"mimeType": mime_type, "data": base64.b64encode(data).decode()}


def test_photos_reach_the_model(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    llm.replies.append(answer("I read **6205-2RSH** on the shield."))
    events = stream(
        chat_client,
        message="What is this?",
        locale="en",
        images=[image(JPEG), image(PNG, "image/png"), image(WEBP, "image/webp")],
    )
    assert text_of(events) == "I read **6205-2RSH** on the shield."

    [(_, request)] = llm.requests
    turn = request.turns[-1]
    assert isinstance(turn, UserTurn)
    assert turn.text == "What is this?"
    assert turn.images == (Image("image/jpeg", JPEG), Image("image/png", PNG), Image("image/webp", WEBP))
    assert "# Photos" in request.system

    # only a note is saved, and later turns replay it as text
    [(content,)] = rows(catalog_db, "select content from assistant_messages where role = 'user'")
    assert content == "[3 photos] What is this?"


def test_a_photo_alone_skips_the_flows(chat_client: TestClient, llm: FakeLlm, catalog_db: str) -> None:
    first = stream(chat_client, preset="datasheet", locale="en")  # the flow asks for a designation
    conversation_id = first[-1]["conversationId"]
    llm.replies.append(answer("That looks like a **6205**."))
    events = stream(chat_client, conversationId=conversation_id, locale="en", images=[image(JPEG)])
    assert text_of(events) == "That looks like a **6205**."
    [(_, request)] = llm.requests
    turn = request.turns[-1]
    assert isinstance(turn, UserTurn)
    assert (turn.text, len(turn.images)) == ("", 1)
    [(content,)] = rows(catalog_db, "select content from assistant_messages where role = 'user' and preset is null")
    assert content == "[photo]"


@pytest.mark.parametrize(
    "images",
    [
        [image(PNG)],  # PNG bytes labelled as JPEG
        [image(b"RIFF\x00\x00\x00\x00AVI LIST", "image/webp")],
        [{"mimeType": "image/gif", "data": base64.b64encode(b"GIF89a").decode()}],
        [{"mimeType": "image/jpeg", "data": "not base64!"}],
        [image(JPEG)] * 4,  # too many
        [{"mimeType": "image/jpeg", "data": "A" * (4 * 1024 * 1024 + 4)}],  # too big
    ],
)
def test_bad_images_are_rejected(chat_client: TestClient, llm: FakeLlm, images: list[dict[str, str]]) -> None:
    res = chat_client.post("/api/v1/assistant/chat", json={"message": "What is this?", "images": images})
    assert (res.status_code, res.json()["code"]) == (422, "validation_failed")
    assert not llm.requests

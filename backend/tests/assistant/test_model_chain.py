import asyncio

import pytest

from app.modules.assistant.llm.client import Chunk, LlmRequest, ModelUnavailableError, TextDelta, UserTurn
from app.modules.assistant.llm.model_chain import ModelChain
from tests.assistant.fakes import FakeLlm, answer

REQUEST = LlmRequest(system="s", turns=[UserTurn("hi")])


def run(chain: ModelChain) -> list[Chunk]:
    async def collect() -> list[Chunk]:
        return [c async for c in chain.stream(REQUEST)]

    return asyncio.run(collect())


def texts(chunks: list[Chunk]) -> str:
    return "".join(c.text for c in chunks if isinstance(c, TextDelta))


def test_first_model_answers() -> None:
    llm = FakeLlm(answer("Hello", "!"))
    chain = ModelChain(llm, ["lite", "flash"], first_token_timeout=1)
    assert texts(run(chain)) == "Hello!"
    assert (llm.models, chain.used) == (["lite"], "lite")


def test_falls_back_when_the_first_is_down() -> None:
    llm = FakeLlm(answer("from flash"), down=("lite",))
    chain = ModelChain(llm, ["lite", "flash"], first_token_timeout=1)
    assert texts(run(chain)) == "from flash"
    assert (llm.models, chain.used) == (["lite", "flash"], "flash")


def test_falls_back_when_the_first_is_silent() -> None:
    llm = FakeLlm(answer("late"), answer("fast"), slow={"lite": 5})
    chain = ModelChain(llm, ["lite", "flash"], first_token_timeout=0.05)
    assert texts(run(chain)) == "fast"
    assert chain.used == "flash"


def test_falls_back_on_an_empty_stream() -> None:
    llm = FakeLlm([], answer("ok"))
    chain = ModelChain(llm, ["lite", "flash"], first_token_timeout=1)
    assert texts(run(chain)) == "ok"


def test_every_model_down() -> None:
    chain = ModelChain(FakeLlm(down=("lite", "flash")), ["lite", "flash"], first_token_timeout=1)
    with pytest.raises(ModelUnavailableError, match="flash"):
        run(chain)


def test_later_calls_stay_on_the_model_that_answered() -> None:
    llm = FakeLlm(answer("one"), answer("two"), down=("lite",))
    chain = ModelChain(llm, ["lite", "flash"], first_token_timeout=1)
    run(chain)
    run(chain)
    assert llm.models == ["lite", "flash", "flash"]


def test_other_errors_are_not_swallowed() -> None:
    chain = ModelChain(FakeLlm(ValueError("bad request")), ["lite", "flash"], first_token_timeout=1)
    with pytest.raises(ValueError, match="bad request"):
        run(chain)


def test_needs_a_model() -> None:
    with pytest.raises(ValueError, match="no models"):
        ModelChain(FakeLlm(), [], first_token_timeout=1)

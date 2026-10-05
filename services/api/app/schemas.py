from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)


class Morpheme(BaseModel):
    text: str

    type: Literal[
        "prefix",
        "root",
        "suffix",
        "particle",
        "none",
    ]


class LogicItem(BaseModel):
    part: str
    meaning: str


class WordAnalysis(BaseModel):
    original: str

    morphemes: list[Morpheme]

    morphemeLogics: list[
        LogicItem
    ]

    gloss: str

    glossLogics: list[
        LogicItem
    ]

    translation: str


class SentenceAnalysis(BaseModel):
    correctedSentence: (
        str | None
    ) = None

    words: list[
        WordAnalysis
    ]

    overallTranslation: str


class AnalyzeRequest(BaseModel):
    """
    Internal request from the Next.js
    gateway to the FastAPI inference
    service.

    apiKey is transient and must never
    be persisted or logged.
    """

    apiKey: str = Field(
        min_length=1
    )

    provider: Literal[
        "openai",
        "deepseek",
        "anthropic",
        "gemini",
    ]

    model: str = Field(
        min_length=1
    )

    systemInstruction: str = Field(
        min_length=1
    )

    userMessage: str = Field(
        min_length=1
    )
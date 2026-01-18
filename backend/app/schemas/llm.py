from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum

class TaskType(str, Enum):
    SUMMARIZATION = "summarization"
    DOUBT_EXPLANATION = "doubt_explanation"
    TOPIC_EXTRACTION = "topic_extraction"
    DIFFICULTY_CLASSIFICATION = "difficulty_classification"
    KEYWORD_EXTRACTION = "keyword_extraction"

class InputType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"

class LLMRequest(BaseModel):
    task: TaskType
    input_type: InputType = InputType.TEXT
    text: Optional[str] = None
    audio_base64: Optional[str] = None
    context: Optional[str] = None  # Additional context if needed

class SummarizationResponse(BaseModel):
    summary: str
    key_points: list[str]

class DoubtExplanationResponse(BaseModel):
    explanation: str
    examples: list[str]
    related_concepts: list[str]

class TopicExtractionResponse(BaseModel):
    main_topics: list[str]
    subtopics: list[str]

class DifficultyClassificationResponse(BaseModel):
    difficulty_level: Literal["beginner", "intermediate", "advanced", "expert"]
    reasoning: str
    prerequisites: list[str]

class KeywordExtractionResponse(BaseModel):
    keywords: list[str]
    phrases: list[str]

class LLMResponse(BaseModel):
    task: TaskType
    result: dict
    raw_output: str

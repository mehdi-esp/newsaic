import ollama
from newsaic.settings import EMBEDDING_BACKEND
from openai import OpenAI
import os

def embed(inputs: list[str]) -> list[list[float]]:

    backend = EMBEDDING_BACKEND.lower()
    if backend == 'openrouter':
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        response = client.embeddings.create(
            model="qwen/qwen3-embedding-0.6b",
            input=inputs
        )
        return [data.embedding for data in response.data]
    elif backend == 'ollama':
        return ollama.embed("qwen3-embedding:0.6B", inputs)["embeddings"]
    else:
        raise ValueError(f"Unknown EMBEDDING_BACKEND: {EMBEDDING_BACKEND}")
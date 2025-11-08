import ollama


EMBEDDING_MODEL = "qwen3-embedding:0.6B"

def embed(inputs: list[str]) -> list[float]:
    return ollama.embed(EMBEDDING_MODEL, inputs)["embeddings"]
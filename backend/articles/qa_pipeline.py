from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from typing import Type
from django_mongodb_backend.expressions import SearchVector
from articles.models import Article, Chunk
from utils.embeddings import embed
from users.models import User
from django.conf import settings


# ------------------------------
# MODELS FOR STRUCTURED OUTPUT
# ------------------------------

class RefinedQuery(BaseModel):
    refined_query: str = Field(..., description="Refined and contextualized search query for vector retrieval.")


class SourceChunk(BaseModel):
    chunk_id: str = Field(..., description="ID of the chunk used in answering.")
    excerpt: str = Field(..., description="Relevant excerpt from the chunk text.")


class QAResponse(BaseModel):
    answer: str = Field(..., description="LLM's concise and factual answer based only on the retrieved content.")
    used_chunks: list[dict] = Field(default_factory=list, description="List of chunks used to generate the answer, with text and source article info.")





# ------------------------------
# LLM FACTORY
# ------------------------------

def get_llm(model_name: str, structured_class: Type[BaseModel] | None = None, temperature: float = 0.3):
    """
    Returns a ChatGroq LLM with optional structured output class.
    """
    llm = ChatGroq(
        model=model_name,
        temperature=temperature,
    )

    if structured_class:
        llm = llm.with_structured_output(structured_class, method="json_schema")

    return llm


# ------------------------------
# STAGE 1: QUERY REFINER
# ------------------------------

def get_query_refiner_prompt(article: Article, user_question: str) -> ChatPromptTemplate:
    """
    Builds the prompt to refine user question for better vector search.
    """
    article_context = f"Title: {article.web_title}\nSection: {article.section_name}\n\nArticle:\n{article.body_text}…"
    system_prompt = """
    You are a query optimization assistant.
    Your task: rewrite the user's question into a concise, context-aware query for semantic vector search.
    The goal is to help retrieve the most relevant text chunks.
    Keep the rewritten query clear, short, and relevant to the article.
    """

    user_prompt = f"""
    Article context:
    {article_context}

    Original question:
    {user_question}

    Refined query:
    """

    return ChatPromptTemplate.from_messages([
        ("system", system_prompt.strip()),
        ("user", user_prompt.strip())
    ])


def generate_refined_query(article: Article, question: str, llm) -> str:
    """
    Runs the query refiner model.
    """
    prompt = get_query_refiner_prompt(article, question)
    chain = prompt | llm
    response: RefinedQuery = chain.invoke({})
    return response.refined_query


# ------------------------------
# STAGE 2: VECTOR SEARCH (MongoDB)
# ------------------------------

def vector_search(refined_query: str, limit: int = 5):
    """
    Executes vector similarity search on all chunks.
    """
    embedded_query = embed([refined_query])[0]

    queryset = Chunk.objects.annotate(
        score=SearchVector(
            path="embedding",
            query_vector=embedded_query,
            limit=limit,
            num_candidates=100
        )
    ).order_by("-score")

    results = list(queryset.only("id", "text", "article_id")[:limit])
    return results


# ------------------------------
# STAGE 3: ANSWER GENERATION
# ------------------------------

def get_answer_prompt(article: Article, question: str, retrieved_chunks: list[Chunk]) -> ChatPromptTemplate:
    chunks_text = "\n\n".join([f"[Chunk {c.id}] {c.text}" for c in retrieved_chunks])

    system_prompt = """
    You are an expert assistant tasked with answering user questions using only the provided chunks and article.
    Never invent facts. If an answer is not found in the chunks, say "I don’t have enough information to answer that question."
    Be concise, factual, and neutral.
    """

    article_title = article.web_title
    section_name = article.section_name

    user_prompt = f"""
    Answer the question using only the information below. Do not invent information.

    Question: {question}

    Article title: {article_title}
    Section: {section_name}

    Article Body:
    {article.body_text}

    Reference material that may help answer the question:
    {chunks_text}
    """


    return ChatPromptTemplate.from_messages([
        ("system", system_prompt.strip()),
        ("user", user_prompt.strip())
    ])




def generate_answer(article: Article, question: str, retrieved_chunks: list[Chunk], llm):
    """
    Runs the answer LLM and returns structured answer including used chunk texts and their source articles.
    """
    # Build a dummy article context for the prompt if needed
    prompt = get_answer_prompt(article, question, retrieved_chunks)
    chain = prompt | llm
    result: QAResponse = chain.invoke({})

    # Include chunk texts with their source articles
    result.used_chunks = [
        {
            "excerpt": chunk.text,
            "article_title": chunk.article.web_title,
            "article_url": chunk.article.web_url
        }
        for chunk in retrieved_chunks
    ]

    return result






# ------------------------------
# MAIN PIPELINE
# ------------------------------

def run_article_qa_pipeline(user: User, article: Article, question: str):
    """
    Complete QA flow for a user's question.
    If article_id is None, the QA is fully dataset-wide.
    """

    # Step 1: Query Refinement (can skip article context if article is None)
    llm_refiner = get_llm("moonshotai/kimi-k2-instruct-0905", structured_class=RefinedQuery)
    refined_query = generate_refined_query(article, question, llm_refiner)
    print(f"Refined query: {refined_query}")

    # Step 2: Vector Search
    retrieved_chunks = vector_search(refined_query, limit=5)

    # Step 3: Answer Generation
    llm_answer = get_llm("moonshotai/kimi-k2-instruct-0905", structured_class=QAResponse)
    result = generate_answer(article, question, retrieved_chunks, llm_answer)

    return result


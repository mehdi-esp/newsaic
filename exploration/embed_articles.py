#!/usr/bin/env python
"""
Subject-agnostic vector-search + RAG demo on Guardian articles.

Features
--------
* RecursiveCharacterTextSplitter (LangChain best-practice)
* Hybrid TF-IDF + semantic chunk selection (configurable keywords)
* Optional parallel / sequential embedding
* In-memory or MongoDB Atlas vector store
* CLI-driven – just change the query list
* Rich logging + tqdm progress
* Optional RAG summarisation with any Ollama LLM
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import time
from typing import List, Dict, Tuple

import numpy as np
from tqdm import tqdm

# LangChain
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Optional Atlas
try:
    from langchain_mongodb import MongoDBAtlasVectorSearch
    from pymongo import MongoClient
    _HAS_ATLAS = True
except Exception:  # pragma: no cover
    _HAS_ATLAS = False

# Parallelism
from joblib import Parallel, delayed

# Scikit-learn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# --------------------------------------------------------------------------- #
# Logging
# --------------------------------------------------------------------------- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Pre-computed embedding wrapper
# --------------------------------------------------------------------------- #
class PrecomputedEmbedding:
    def __init__(self, vectors: List[List[float]]):
        self.vectors = vectors
        self.idx = 0

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        batch = self.vectors[self.idx : self.idx + len(texts)]
        self.idx += len(texts)
        return batch

    def embed_query(self, text: str) -> List[float]:
        return OllamaEmbeddings(model=ARGS.model).embed_query(text)


# --------------------------------------------------------------------------- #
# Core engine – completely subject-agnostic
# --------------------------------------------------------------------------- #
class GuardianSearch:
    def __init__(
        self,
        file_path: str,
        sample_size: int,
        model: str,
        use_parallel: bool,
        store_type: str,
        atlas_uri: str | None,
        llm_model: str,
        # ---- NEW: subject-specific configuration -----------------------
        subject_keywords: List[str],
        reference_query: str,
    ):
        self.file_path = file_path
        self.sample_size = min(sample_size, 2000)          # safety cap
        self.model = model
        self.use_parallel = use_parallel
        self.store_type = store_type.lower()
        self.atlas_uri = atlas_uri
        self.llm_model = llm_model

        # ---- Subject-specific ------------------------------------------------
        self.subject_keywords = [kw.lower() for kw in subject_keywords]
        self.ref_query = reference_query

        # Embedding & TF-IDF
        self.embeddings = OllamaEmbeddings(model=self.model)
        self.tfidf = TfidfVectorizer(max_features=2_000, stop_words="english")

        # Recursive splitter (works for any language)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=64,
            length_function=len,
            separators=[
                "\n\n", "\n", " ", ".", ",", "\u200b",
                "\uff0c", "\u3001", "\uff0e", "\u3002", "",
            ],
        )

    # ------------------------------------------------------------------- #
    # Load
    # ------------------------------------------------------------------- #
    def load_articles(self) -> List[Dict]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("JSON root must be a list of articles")
        log.info(f"Loaded {len(data)} total articles")
        return data

    # ------------------------------------------------------------------- #
    # Flexible filtering – uses the supplied subject keywords
    # ------------------------------------------------------------------- #
    def filter_articles(self, articles: List[Dict]) -> List[Dict]:
        candidates = []
        for a in articles[: self.sample_size]:
            title = a.get("webTitle", "").lower()
            body = a.get("fields", {}).get("bodyText", "").lower()
            section = a.get("sectionId", "").lower()

            # 1. Section match (optional – keep generic)
            if any(sec in section for sec in ["environment", "science", "technology", "politics"]):
                candidates.append(a)
                continue

            # 2. Title or body contains any subject keyword
            if any(kw in title for kw in self.subject_keywords) or \
               any(kw in body for kw in self.subject_keywords):
                candidates.append(a)

        log.info(f"Filtered {len(candidates)} candidate articles for subject")
        return candidates[:500]   # final cap

    # ------------------------------------------------------------------- #
    # Hybrid chunk selection (TF-IDF + semantic)
    # ------------------------------------------------------------------- #
    def _tfidf_scores(self, chunks: List[str]) -> np.ndarray:
        try:
            matrix = self.tfidf.fit_transform(chunks)
            scores = np.zeros(len(chunks))
            for kw in self.subject_keywords:
                idx = self.tfidf.vocabulary_.get(kw, -1)
                if idx != -1:
                    scores += matrix[:, idx].toarray().flatten()
            return scores
        except Exception:
            return np.zeros(len(chunks))

    def _semantic_scores(self, chunks: List[str]) -> np.ndarray:
        ref_vec = self.embeddings.embed_query(self.ref_query)
        chunk_vecs = self.embeddings.embed_documents(chunks)
        return cosine_similarity([ref_vec], chunk_vecs)[0]

    def select_best_chunk(self, chunks: List[str]) -> str:
        if not chunks:
            return ""

        tfidf = self._tfidf_scores(chunks)
        semantic = self._semantic_scores(chunks)

        tfidf_norm = tfidf / (tfidf.max() + 1e-12)
        semantic_norm = semantic / (semantic.max() + 1e-12)
        combined = 0.5 * tfidf_norm + 0.5 * semantic_norm

        best_idx = int(np.argmax(combined))
        log.debug(f"Best chunk score {combined[best_idx]:.3f}")
        return chunks[best_idx]

    # ------------------------------------------------------------------- #
    # Embedding pipeline
    # ------------------------------------------------------------------- #
    def _process_one(self, article: Dict) -> Tuple[List[float], str, Dict]:
        body = article.get("fields", {}).get("bodyText", "")
        chunks = self.splitter.split_text(body)
        best = self.select_best_chunk(chunks)
        embedding = self.embeddings.embed_documents([best])[0]
        meta = {"title": article["webTitle"], "id": article["id"]}
        return embedding, body, meta

    def embed_articles(self, articles: List[Dict]) -> Tuple[List[List[float]], List[str], List[Dict]]:
        if self.use_parallel:
            log.info("Embedding in parallel (threading)…")
            results = Parallel(n_jobs=-1, backend="threading", verbose=1)(
                delayed(self._process_one)(a) for a in articles
            )
        else:
            log.info("Embedding sequentially…")
            results = [self._process_one(a) for a in tqdm(articles, desc="Embedding")]

        embeddings, texts, metas = zip(*results)
        return list(embeddings), list(texts), list(metas)

    # ------------------------------------------------------------------- #
    # Vector store
    # ------------------------------------------------------------------- #
    def build_vectorstore(self, embeddings, texts, metas):
        wrapper = PrecomputedEmbedding(embeddings)

        if self.store_type == "atlas" and _HAS_ATLAS and self.atlas_uri:
            client = MongoClient(self.atlas_uri)
            coll = client["guardian_demo"]["articles"]
            vs = MongoDBAtlasVectorSearch(
                collection=coll,
                embedding=wrapper,
                index_name="guardian_vector_index",
                relevance_score_fn="cosine",
            )
            try:
                vs.create_vector_search_index(dimensions=768)
            except Exception:
                pass
            log.info("Adding to Atlas…")
            vs.add_texts(texts=texts, metadatas=metas)
            return vs

        log.info("Building in-memory store…")
        return InMemoryVectorStore.from_texts(
            texts=texts,
            embedding=wrapper,
            metadatas=metas,
        )

    # ------------------------------------------------------------------- #
    # Retrieval & pretty print
    # ------------------------------------------------------------------- #
    @staticmethod
    def highlight(text: str, phrases: List[str]) -> str:
        for p in phrases:
            text = re.sub(rf"\b({re.escape(p)})\b", r"**\1**", text, flags=re.IGNORECASE)
        return text

    def retrieve_and_print(self, vectorstore, queries: List[str]):
        retriever = vectorstore.as_retriever(
            search_kwargs={"k": 5, "score_threshold": 0.60}
        )
        for q in queries:
            docs = retriever.invoke(q)
            print(f"\n{'='*20} QUERY: {q} {'='*20}")
            if not docs:
                print("  (no results above threshold)")
                continue
            for i, doc in enumerate(docs, 1):
                snippet = self.highlight(doc.page_content[:500], self.subject_keywords)
                print(f"\n{i}. **{doc.metadata['title']}**")
                print(f"   ID: {doc.metadata['id']}")
                print(f"   Snippet: {snippet}...")

    # ------------------------------------------------------------------- #
    # RAG summarisation
    # ------------------------------------------------------------------- #
    def rag_summarise(self, vectorstore, query: str, top_k: int = 3):
        retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})
        docs = retriever.invoke(query)
        context = "\n\n".join(d.page_content for d in docs)
        prompt = f"""You are an expert journalist.
Summarize the following passages (max 3 sentences) focusing on the core topic:

{context}

Summary:"""
        llm = OllamaLLM(model=self.llm_model)
        answer = llm.invoke(prompt)
        print(f"\nRAG Summary for '{query}':\n{answer}")

    # ------------------------------------------------------------------- #
    # Run
    # ------------------------------------------------------------------- #
    def run(self, queries: List[str], enable_rag: bool = False):
        start = time.time()

        articles = self.load_articles()
        sample = self.filter_articles(articles)
        if not sample:
            log.warning("No articles matched – using first N as fallback")
            sample = articles[: self.sample_size]

        embeddings, texts, metas = self.embed_articles(sample)
        vectorstore = self.build_vectorstore(embeddings, texts, metas)

        self.retrieve_and_print(vectorstore, queries)
        if enable_rag:
            for q in queries:
                self.rag_summarise(vectorstore, q)

        log.info(f"Total elapsed: {time.time() - start:.2f}s")


# --------------------------------------------------------------------------- #
# CLI – subject is defined by a JSON file (or inline list)
# --------------------------------------------------------------------------- #
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Subject-agnostic Guardian vector search + RAG")
    p.add_argument("--file", default="./the-guardian-articles-9-26-to-10-18.json")
    p.add_argument("--sample", type=int, default=1000, help="Max articles to consider")
    p.add_argument(
        "--model",
        default="nomic-embed-text",
        help="Ollama embedding model (nomic-embed-text recommended)",
    )
    p.add_argument("--parallel", action="store_true")
    p.add_argument("--store", choices=["memory", "atlas"], default="memory")
    p.add_argument("--atlas-uri", default=os.getenv("MONGODB_ATLAS_URI"))
    p.add_argument("--rag", action="store_true")
    p.add_argument("--llm-model", default="llama3.2:3b")
    # ---- Subject configuration ------------------------------------------------
    p.add_argument(
        "--subject-config",
        default=None,
        help="Path to JSON file: { \"keywords\": [...], \"reference\": \"...\" }",
    )
    return p


# --------------------------------------------------------------------------- #
# Demo subject configurations
# --------------------------------------------------------------------------- #
DEMO_SUBJECTS = {
    "climate": {
        "keywords": [
            "climate change", "global warming", "carbon emissions",
            "greenhouse gas", "net zero", "sustainability", "co2"
        ],
        "reference": "climate change impact"
    },
    "ai": {
        "keywords": ["artificial intelligence", "machine learning", "ai", "deep learning", "gpt"],
        "reference": "impact of artificial intelligence"
    },
    "politics": {
        "keywords": ["election", "trump", "biden", "congress", "policy"],
        "reference": "US election 2024"
    },
}


if __name__ == "__main__":
    ARGS = build_parser().parse_args()

    if ARGS.store == "atlas" and not ARGS.atlas_uri:
        log.error("Atlas selected but MONGODB_ATLAS_URI missing")
        raise SystemExit(1)

    # -------------------------------------------------------------
    # Load subject configuration
    # -------------------------------------------------------------
    if ARGS.subject_config:
        with open(ARGS.subject_config) as f:
            subj = json.load(f)
        subject_keywords = subj["keywords"]
        reference_query = subj["reference"]
    else:
        # Default demo: climate
        subj = DEMO_SUBJECTS["climate"]
        subject_keywords = subj["keywords"]
        reference_query = subj["reference"]
        log.info("No --subject-config → using CLIMATE demo")

    # -------------------------------------------------------------
    # Queries – change these to any topic you like
    # -------------------------------------------------------------
    QUERIES = [
        "climate change impact",
        "global warming effects",
        "carbon emissions reduction",
    ]

    demo = GuardianSearch(
        file_path=ARGS.file,
        sample_size=ARGS.sample,
        model=ARGS.model,
        use_parallel=ARGS.parallel,
        store_type=ARGS.store,
        atlas_uri=ARGS.atlas_uri,
        llm_model=ARGS.llm_model,
        subject_keywords=subject_keywords,
        reference_query=reference_query,
    )

    demo.run(QUERIES, enable_rag=ARGS.rag)
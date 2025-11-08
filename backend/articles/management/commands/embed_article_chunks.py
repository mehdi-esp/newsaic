from django.core.management.base import BaseCommand
from articles.models import Article, Chunk
import logging
from utils.embeddings import embed
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm
from langchain_core.documents import Document

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.hasHandlers():
    console_handler = logging.StreamHandler()
    logger.addHandler(console_handler)

# Text splitter configuration
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=512,
    chunk_overlap=50
)


def embed_article_chunks(articles: list[Article]):
    """
    Split all articles into chunks, generate embeddings in a single batch,
    and return Chunk instances. Does NOT write to the database.
    """
    # Build Documents for all articles
    documents = [
        Document(page_content=article.body_text, metadata={"article_id": article.id})
        for article in articles
    ]

    # Split documents into chunks, preserving metadata
    chunked_documents = text_splitter.split_documents(documents)

    if not chunked_documents:
        tqdm.write("No chunks produced for this batch. Skipping.")
        return []

    # Assign chunk_index manually per article
    chunk_indices = {}
    for doc in chunked_documents:
        article_id = doc.metadata["article_id"]
        idx = chunk_indices.get(article_id, 0)
        doc.metadata["chunk_index"] = idx
        chunk_indices[article_id] = idx + 1

    # Extract text for embedding
    texts = [doc.page_content for doc in chunked_documents]

    try:
        embeddings = embed(texts)
    except Exception as e:
        tqdm.write(f"Error embedding batch: {e}")
        return []

    # Build Chunk instances using metadata from Documents
    chunks_to_create = [
        Chunk(
            article_id=doc.metadata["article_id"],
            chunk_index=doc.metadata["chunk_index"],
            text=doc.page_content,
            embedding=embedding
        )
        for doc, embedding in zip(chunked_documents, embeddings)
    ]

    tqdm.write(f"Prepared {len(chunks_to_create)} chunks for {len(articles)} articles")
    return chunks_to_create


class Command(BaseCommand):
    help = "Generate chunks and embeddings for articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=30,
            help="Number of articles to batch embed.",
        )
        parser.add_argument(
            "--max-articles",
            type=int,
            default=None,
            help="Optional: maximum number of articles to process in this run",
        )
        parser.add_argument(
            "--reembed",
            action="store_true",
            help="Re-embed articles even if chunks already exist",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        max_articles = options["max_articles"]
        reembed = options["reembed"]

        articles_qs = Article.objects.all().order_by("-first_publication_date")
        if not reembed:
            articles_qs = articles_qs.filter(chunks__isnull=True)

        if max_articles:
            articles_qs = articles_qs[:max_articles]

        total_articles = articles_qs.count()
        if total_articles == 0:
            tqdm.write("No articles found to process. Exiting.")
            return

        articles_list = list(articles_qs)

        tqdm.write(
            f"Processing {total_articles} articles for chunk embedding "
            f"(batch size: {batch_size}, force={reembed})"
        )

        for start in tqdm(
            range(0, total_articles, batch_size),
            desc=f"Embedding articles (total: {total_articles})",
            unit="batch",
        ):
            end = min(start + batch_size, total_articles)
            articles_batch = articles_list[start:end]

            if reembed:
                Chunk.objects.filter(article__in=articles_batch).delete()

            all_chunks_to_create = embed_article_chunks(articles_batch)

            if all_chunks_to_create:
                Chunk.objects.bulk_create(all_chunks_to_create)
                tqdm.write(
                    f"Bulk wrote {len(all_chunks_to_create)} chunks for articles {start + 1}-{end}"
                )

        tqdm.write("All chunk embeddings completed.")

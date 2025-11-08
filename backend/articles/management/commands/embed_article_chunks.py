from django.core.management.base import BaseCommand
from articles.models import Article, Chunk
import logging
from utils.embeddings import embed
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm

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


def embed_article_chunks(article: Article):
    """
    Split an article into chunks, generate embeddings for the chunks, and return them.
    Does NOT write to the database.
    """
    texts = text_splitter.split_text(article.body_text)

    if not texts:
        tqdm.write(f"Article '{article.web_title}' produced no chunks. Skipping.")
        return []

    try:
        embeddings = embed(texts)
    except Exception as e:
        tqdm.write(f"Error embedding chunks for article '{article.web_title}': {e}")
        return []

    chunks = [
        Chunk(article=article, chunk_index=i, text=text, embedding=embedding)
        for i, (text, embedding) in enumerate(zip(texts, embeddings))
    ]

    tqdm.write(f"Prepared {len(chunks)} chunks for article '{article.web_title}'")
    return chunks


class Command(BaseCommand):
    help = "Generate chunks and embeddings for articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=20,
            help="Number of articles to bulk write per DB operation",
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
        # Note: batch_size is for DB writes, not embeddings.

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
            end = start + batch_size
            end = min(end, total_articles)

            articles_batch = articles_list[start:end]

            if reembed:
                Chunk.objects.filter(article__in=articles_batch).delete()

            all_chunks_to_create = []
            for article in articles_batch:
                chunks = embed_article_chunks(article)
                if chunks:
                    all_chunks_to_create.extend(chunks)

            if all_chunks_to_create:
                Chunk.objects.bulk_create(all_chunks_to_create)
                tqdm.write(
                    f"Bulk wrote {len(all_chunks_to_create)} chunks for articles {start + 1}-{start + len(articles_batch)}"
                )

        tqdm.write("All chunk embeddings completed.")

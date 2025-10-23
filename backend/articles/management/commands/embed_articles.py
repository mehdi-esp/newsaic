from django.core.management.base import BaseCommand
from articles.models import Article
import logging
import ollama

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.hasHandlers():
    console_handler = logging.StreamHandler()
    logger.addHandler(console_handler)

EMBEDDING_MODEL = "qwen3-embedding:0.6B"

def embed_articles(batch_size: int = 100):
    """
    Generates embeddings for articles that do not yet have embeddings.
    """
    articles = list(Article.objects.filter(embedding__isnull=True))
    total = len(articles)

    if total == 0:
        logger.info("No articles found without embeddings. Exiting.")
        return

    logger.info(f"Starting embedding for {total} articles")

    for i in range(0, total, batch_size):
        batch = articles[i : i + batch_size]
        contents = [a.body_text for a in batch]

        try:
            embeddings = ollama.embed(EMBEDDING_MODEL, contents)["embeddings"]
            for article, embedding in zip(batch, embeddings):
                article.embedding = embedding
            Article.objects.bulk_update(batch, ["embedding"])
            logger.info(
                f"Embedded batch {i // batch_size + 1} of {((total - 1) // batch_size) + 1}"
            )
        except Exception as e:
            logger.error(f"Error embedding batch {i // batch_size + 1}: {e}")
        logger.info("Embedding process completed.")


class Command(BaseCommand):
    help = "Generate embeddings for articles without embeddings"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of articles to process in each batch",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        embed_articles(batch_size=batch_size)
import requests
import time
from celery import shared_task
from datetime import datetime, timedelta, timezone
from articles.models import Article
import logging
import os
import ollama
from django.db import IntegrityError
from django.db.transaction import atomic

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


GUARDIAN_API_KEY = os.getenv("GUARDIAN_API_KEY")
SHOW_FIELDS = "headline,trailText,standfirst,byline,body,bodyText,thumbnail,firstPublicationDate,lastModified"
PAGE_SIZE = 200
MAX_PAGES = 10
STOP_AGE_HOURS = 24
TYPE = "article"

@shared_task(queue="news_fetching")
def fetch_guardian_articles(
    stop_age_hours: int = STOP_AGE_HOURS,
    only_recent: bool = True,
    page_size: int | None = None,
    max_pages = MAX_PAGES,
):
    logger.info("=== Starting Guardian fetch task ===")

    base_url = "https://content.guardianapis.com/search"
    page = 1
    total_fetched = 0

    from_date = None
    stop_age_date = datetime.now(timezone.utc) - timedelta(hours=stop_age_hours)

    most_recent_article = Article.objects.order_by("-first_publication_date").first()
    if (
        only_recent
        and most_recent_article
        and most_recent_article.first_publication_date > stop_age_date
    ):
        from_date = most_recent_article.first_publication_date
    else:
        from_date = stop_age_date

    existing_ids = set(
        Article.objects.values_list(
            "guardian_id", flat=True
        )
    )

    if page_size is None:
        # Depends on how recent the from_date is
        hours_diff = (datetime.now(timezone.utc) - from_date).total_seconds() / 3600
        if hours_diff <= 1:
            page_size = 20
        elif hours_diff <= 6:
            page_size = 50
        elif hours_diff <= 12:
            page_size = 100
        else:
            page_size = PAGE_SIZE

    params_base = {
        "api-key": GUARDIAN_API_KEY,
        "show-fields": SHOW_FIELDS,
        "show-tags": "keyword,contributor",
        "page-size": page_size,
        "order-by": "newest",
        "type": TYPE,
    }

    if from_date:
        params_base["from-date"] = from_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info(f"Fetching articles from {from_date.isoformat()} onwards")
    else:
        logger.info("Fetching all articles without date restriction")

    while True:
        params = params_base.copy() | {"page": page}

        logger.info(f"Requesting page {page} from Guardian API")
        try:
            response = requests.get(base_url, params=params, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            try:
                error_data = e.response.json() if e.response else {}
                message = error_data.get("message", str(e))
            except Exception:
                message = str(e)
            logger.error(f"Failed to fetch page {page}: {message}")
            break

        data = response.json()["response"]
        results = data["results"]
        total_pages = min(data["pages"], max_pages)

        if not results:
            logger.info("No results returned, stopping fetch.")
            break

        logger.info(f"Processing {len(results)} articles from page {page}")

        new_articles = []
        reached_max_age = False
        for i, item in enumerate(results, start=1):

            guardian_id = item["id"]
            article_date = datetime.fromisoformat(
                item["webPublicationDate"].replace("Z", "+00:00")
            )
            if article_date < from_date:
                logger.info(
                    f"Article {guardian_id} ( article {i}/{len(results)} ) is older than from_date, stopping fetch for this page"
                )
                reached_max_age = True
                break

            if guardian_id in existing_ids:
                continue

            # Exclude empty text articles
            if item["fields"]["bodyText"].strip() == "":
                continue

            new_articles.append(Article.from_guardian_result(item))
            existing_ids.add(guardian_id)

        logger.info(f"Page {page} of {total_pages} processed.")

        if new_articles:
            Article.objects.bulk_create(new_articles)
            logger.info(f"Saved {len(new_articles)} new articles from page {page}")
            total_fetched += len(new_articles)
        elif from_date:
            logger.info("No new articles found on this page, stopping fetch.")
            break

        if reached_max_age:
            logger.info(
                f"Found an article older than {from_date}, stopping fetch for this page"
            )
            break

        # Stop if we've reached the final page
        if page >= total_pages:
            logger.info("Reached last page, stopping fetch.")
            break

        page += 1
        time.sleep(1)

    logger.info(
        f"=== Guardian fetch task completed: total new articles saved: {total_fetched} ==="
    )


EMBEDDING_MODEL = "qwen3-embedding:0.6B"

@shared_task(queue="embeddings")
def embed_articles(batch_size=50, single_batch=False):
    """
    Celery task that generates embeddings for all articles
    that do not yet have embeddings, in batches.
    """
    articles = Article.objects.filter(embedding__isnull=True)
    total = articles.count()
    logger.info(f"Starting embedding for {total} articles")

    if single_batch:  # All at once
        contents = [a.body_text for a in articles]
        embeddings = ollama.embed(EMBEDDING_MODEL, contents)["embeddings"]
        for article, embedding in zip(articles, embeddings):
            article.embedding = embedding
        Article.objects.bulk_update(articles, ["embedding"])
        logger.info(f"Embedded all {total} articles in a single batch")
    else:  # In batches
        for i in range(0, total, batch_size):
            batch = articles[i : i + batch_size]
            contents = [a.body_text for a in batch]
            try:
                embeddings = ollama.embed(EMBEDDING_MODEL, contents)["embeddings"]
                for article, embedding in zip(batch, embeddings):
                    article.embedding = embedding
                Article.objects.bulk_update(batch, ["embedding"])
                logger.info(
                    f"Embedded batch {i//batch_size + 1} of {((total-1)//batch_size) + 1}"
                )
            except Exception as e:
                logger.exception(f"Error embedding batch starting at index {i}: {e}")

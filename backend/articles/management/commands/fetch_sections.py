import requests
import time
from django.core.management.base import BaseCommand
from articles.models import Section
import os
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.hasHandlers():
    console_handler = logging.StreamHandler()
    logger.addHandler(console_handler)

GUARDIAN_SECTIONS_URL = "https://content.guardianapis.com/sections"

def fetch_guardian_sections():
    logger.info("=== Starting Guardian sections fetch task ===")

    api_key = os.getenv("GUARDIAN_API_KEY")
    if not api_key:
        logger.error("GUARDIAN_API_KEY environment variable not set")
        return

    params = {
        "api-key": api_key,
    }

    try:
        response = requests.get(GUARDIAN_SECTIONS_URL, params=params, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        try:
            error_data = e.response.json() if e.response else {}
            message = error_data.get("message", str(e))
        except Exception:
            message = str(e)
        logger.error(f"Failed to fetch sections: {message}")
        return

    data = response.json().get("response", {})
    results = data.get("results", [])
    if not results:
        logger.info("No sections returned from Guardian API.")
        return

    new_sections = 0
    for sec in results:
        web_title = sec.get("webTitle", "")
        if "do not use" in web_title.lower():
            logger.info(f"Skipping section '{web_title}'")
            continue
        section, created = Section.objects.update_or_create(
            section_id=sec.get("id"),
            defaults={
                "web_title": sec.get("webTitle"),
                "web_url": sec.get("webUrl"),
                "api_url": sec.get("apiUrl"),
            },
        )
        if created:
            logger.info(f"Created section: {section.web_title}")
            new_sections += 1
        else:
            logger.info(f"Updated section: {section.web_title}")

    logger.info(f"=== Guardian sections fetch completed: {new_sections} new sections added ===")

class Command(BaseCommand):
    help = 'Fetch all sections from the Guardian API and store them in the database'

    def handle(self, *args, **options):
        fetch_guardian_sections()
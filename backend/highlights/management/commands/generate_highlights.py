from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, datetime, time
from articles.models import Article
from users.models import User, UserType
from highlights.models import Story, DailyHighlight
from pydantic import BaseModel, Field
from typing import Type
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from django.db import transaction
from kokoro import KPipeline
import soundfile as sf
import numpy as np
import io
from django.core.files.base import ContentFile


class StoryIdea(BaseModel):
    suggested_title: str = Field(
        ..., description="A concise title summarizing the story idea."
    )
    idea: str = Field(
        ...,
        max_length=500,
        description="The main concept or idea of the story (max 500 characters).",
    )
    source_articles: list[str] = Field(
        ..., description="List of IDs of source articles that inspired the idea."
    )


class StoryIdeasResponse(BaseModel):
    stories: list[StoryIdea]


class GeneratedStory(BaseModel):
    rewritten_title: str = Field(..., description="The rewritten title of the article")
    rewritten_body: str = Field(..., description="The rewritten body of the article")


def get_llm(
    model_name: str,
    structured_class: Type[BaseModel] | None = None,
    reason: bool = True,
    temperature: float = 0.7,
):
    reasoning_format = None
    if reason and model_name in [
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3-32b",
    ]:
        reasoning_format = "hidden"

    llm = ChatGroq(
        model=model_name,
        reasoning_format=reasoning_format,
        temperature=temperature,
    )

    if structured_class is not None:
        if model_name in [
            "openai/gpt-oss-20b",
            "openai/gpt-oss-120b",
            "moonshotai/kimi-k2-instruct-0905",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
            "meta-llama/llama-4-scout-17b-16e-instruct",
        ]:
            structured_method = "json_schema"
        else:
            structured_method = "function_calling"

        llm = llm.with_structured_output(structured_class, method=structured_method)

    return llm


def get_story_idea_prompt(user: User, articles: list[Article]):
    today = date.today()
    age = (
        today.year
        - user.birthday.year
        - ((today.month, today.day) < (user.birthday.month, user.birthday.day))
    )
    gender = user.gender

    system_prompt = f"""
    You are an assistant specialized in identifying and grouping news articles into potential story ideas.

    The user is {age} years old, {gender}, and interested in sections: {[s.section_name for s in user.preferred_sections]}.
    """

    article_lines = []
    for a in articles:
        words = (a.body_text or "").split()
        excerpt = " ".join(words[:50])
        if len(words) > 50:
            excerpt += "…"  # truncated
        article_lines.append(
            f"- ID: {a.guardian_id}\n"
            f"  Title: {a.web_title}\n"
            f"  Section: {a.section_name}\n"
            f"  Keywords: {[t.web_title for t in a.tags]}\n"
            f"  Excerpt: {excerpt}"
        )
    articles_text = "\n".join(article_lines)

    user_prompt = f"""
These are today's highlights. Produce a few story ideas, no more than 10, representing the most interesting stories
from the articles provided.

A story can be:
- Single-article story, if it is notable or interesting.
- Multi-article story, if several articles share a clear theme or pattern.

Guidelines:

- Only include articles that are especially interesting to the user or particularly important/notable.
- Prioritize the strongest highlights; do not try to reach a certain number if fewer are meaningful.
- Avoid repeating the same topic too many times; do not create too many stories that cover the same event or theme.
- Only group articles if there is a clear thematic link.
- Discard irrelevant or weak articles — focus on quality, not quantity.

Articles to analyze:
{articles_text}
    """

    return ChatPromptTemplate.from_messages(
        [("system", system_prompt.strip()), ("user", user_prompt.strip())]
    )


def generate_story_ideas_for_user(user: User, articles: list[Article], llm):
    """
    Generates story ideas for a user based on a list of articles using a provided LLM.

    Args:
        user: The User object (must be a news reader).
        articles: List of Article objects to analyze.
        llm: A ChatGroq LLM instance

    Returns:
        Parsed output from the LLM, typically a StoryIdeasResponse object if structured_class is used.
    """
    prompt = get_story_idea_prompt(user, articles)

    chain = prompt | llm

    result = chain.invoke({})

    return result


def get_articles_for_user(user: User, min_articles=30, max_articles=50):

    now = timezone.now()
    today_start = datetime.combine(now.date(), time.min).replace(
        tzinfo=timezone.get_current_timezone()
    )

    section_ids = [s.section_id for s in user.preferred_sections]

    preferred_articles = list(
        Article.objects.filter(
            section_id__in=section_ids,
            first_publication_date__gte=today_start,
        ).order_by("first_publication_date")[:max_articles]
    )

    if len(preferred_articles) >= min_articles:
        return preferred_articles

    needed = min_articles - len(preferred_articles)
    other_articles = list(
        Article.objects.filter(
            first_publication_date__gte=today_start,
        )
        .exclude(id__in=[a.id for a in preferred_articles])
        .order_by("first_publication_date")[:needed]
    )

    return preferred_articles + other_articles


def get_rewriter_prompt(
    user: User,
    story_idea: StoryIdea,
    source_articles: list[Article],
) -> ChatPromptTemplate:

    persona = user.persona
    today = date.today()
    age = (
        today.year
        - user.birthday.year
        - ((today.month, today.day) < (user.birthday.month, user.birthday.day))
    )
    gender = user.gender

    system_prompt = f"""
    You are a professional news writer. Write in a {persona.tone} tone, using {persona.style}, 
    and aim for {persona.length} length. Your writing should engage a reader who is 
    {age} years old, {gender}, and interested in sections: {[s.section_name for s in user.preferred_sections]}.
    {persona.extra_instructions or ""}
    """

    article_lines = []
    for i, a in enumerate(source_articles, 1):
        article_lines.append(
            f"=== Article {i} ===\n"
            f"ID: {a.guardian_id}\n"
            f"Title: {a.web_title}\n"
            f"Section: {a.section_name}\n"
            f"Keywords: {[t.web_title for t in a.tags]}\n"
            f"Body:\n{a.body_text or ''}"
        )
    articles_text = "\n\n".join(article_lines)

    article_count = len(source_articles)

    guidelines = [
        "Produce **one article** that synthesizes the source content into a coherent story.",
        "Use the **story idea** to guide the narrative but allow flexibility for a natural, engaging flow.",
        "Keep the writing **clear, concise, engaging**, and faithful to the story idea.",
        "Create a **title that reflects the source content**, using the suggested title only as a reference.",
    ]

    if article_count > 1:
        guidelines.insert(
            1,
            "Ensure **all source articles** are represented; do not focus disproportionately on a single article.",
        )
        guidelines.insert(
            2,
            "Highlight the most relevant and important information from each article.",
        )

    # Store the join string outside the f-string to avoid backslash issue
    guidelines_separator = "\n- "
    guidelines_text = guidelines_separator.join(guidelines)

    user_prompt = f"""
Write a single, polished, readable news article based on the following story idea. The story will have a title and a body. 
Use the story idea to guide the article, but do not treat the suggested title as mandatory — it is just a guide.

**Guidelines:**
- {guidelines_text}

Story Idea:
- Suggested Title: {story_idea.suggested_title}
- Idea: {story_idea.idea}

Source Articles (total {article_count}):
{articles_text}
    """

    return ChatPromptTemplate.from_messages(
        [("system", system_prompt.strip()), ("user", user_prompt.strip())]
    )


def rewrite_story(
    user: User, story_idea: StoryIdea, source_articles: list[Article], llm
) -> GeneratedStory:
    """
    Generates a rewritten story from a single story idea and its source articles.
    Returns a single GeneratedStory object.
    """
    prompt = get_rewriter_prompt(user, story_idea, source_articles)
    chain = prompt | llm
    return chain.invoke({})


class Command(BaseCommand):
    help = "Generate story ideas, rewrite them, and add TTS narrations for news readers based on today's articles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--user_id",
            type=str,
            help="Generate highlights for a specific user ID.",
        )
        parser.add_argument('--voice', type=str, default='af_heart', help='Kokoro voice to use (default: af_heart)')
        parser.add_argument('--dry-run', action='store_true', help='Preview without generating/saving audio')
        parser.add_argument('--no-narrate', action='store_true', help='Skip narration generation (default: narrate)')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        voice = options['voice']
        user_id = options.get("user_id")

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stderr.write(f"No user found with ID {user_id}")
                return

            if user.user_type != UserType.READER:
                self.stderr.write(f"User {user_id} is not a news reader")
                return

            users = [user]
        else:
            users = User.objects.filter(user_type=UserType.READER)

        if dry_run:
            self.stdout.write("Dry run mode: Generating highlights but previewing narrations without saving.")

        if not dry_run:
            pipeline = KPipeline(lang_code='a')  # Initialize TTS pipeline only if not dry run

        for user in users:
            candidate_articles = get_articles_for_user(user)

            if not candidate_articles:
                self.stdout.write(f"No articles for user {user.id} ({user}) today")
                continue

            self.stdout.write(
                f"Selected {len(candidate_articles)} articles for user {user.id} ({user}) today"
            )

            llm_idea_generator = get_llm(
                "moonshotai/kimi-k2-instruct-0905", structured_class=StoryIdeasResponse
            )

            try:
                story_ideas_response = generate_story_ideas_for_user(
                    user, candidate_articles, llm_idea_generator
                )
            except Exception as e:
                self.stderr.write(
                    f"[ERROR] Failed to generate story ideas for user {user.id}: {e}"
                )
                continue

            self.stdout.write(
                f"Generated {len(story_ideas_response.stories)} story ideas for user {user.id}"
            )

            llm_rewriter = get_llm(
                "moonshotai/kimi-k2-instruct-0905", structured_class=GeneratedStory
            )

            with transaction.atomic():
                daily_highlight = DailyHighlight.objects.create(
                    user=user, persona_snapshot=user.persona
                )

                for order_index, story_idea in enumerate(
                    story_ideas_response.stories, start=1
                ):
                    self.stdout.write(
                        f"\n[Story Idea #{order_index}] {story_idea.suggested_title}:"
                    )
                    self.stdout.write(f"  Idea: {story_idea.idea}")
                    self.stdout.write(f"  Source Articles: {story_idea.source_articles}")

                    source_articles_objs = [
                        a
                        for a in candidate_articles
                        if a.guardian_id in story_idea.source_articles
                    ]

                    if not source_articles_objs:
                        self.stdout.write(
                            "  No source articles found, skipping rewrite."
                        )
                        continue

                    try:
                        rewritten_story = rewrite_story(
                            user, story_idea, source_articles_objs, llm_rewriter
                        )
                    except Exception as e:
                        self.stderr.write(
                            f"[ERROR] Failed to rewrite story #{order_index} for user {user.id}: {e}"
                        )
                        continue

                    story_record = Story.objects.create(
                        daily_highlight=daily_highlight,
                        title=rewritten_story.rewritten_title,
                        body_text=rewritten_story.rewritten_body,
                        order=order_index,
                    )
                    story_record.source_articles.set(source_articles_objs)

                    self.stdout.write(f"  Stored story in DB: {story_record}")

                    # Generate narration for the newly created story
                    if dry_run:
                        self.stdout.write(f"  Would generate narration for story {story_record.id} with voice {voice}.")
                        continue

                    generator = pipeline(story_record.body_text, voice=voice)
                    audio_array = np.concatenate([audio for _, _, audio in generator])

                    buffer = io.BytesIO()
                    sf.write(buffer, audio_array, samplerate=24000, format="WAV")
                    buffer.seek(0)

                    audio_file = ContentFile(buffer.read(), name=f"{story_record.id}_narration.wav")
                    story_record.narration = audio_file
                    story_record.save()

                    self.stdout.write(self.style.SUCCESS(f"  Narration saved for story {story_record.id}"))
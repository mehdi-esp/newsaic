# Generating Audio for Daily Highlights using Kokoro

## Prerequisites

Make sure the following steps have been completed in order:

1. Completed the backend [ReadMe](../backend/README.md) **Setup** instructions.
2. A user of type `news_reader` exists in the database and has a defined persona and preferred sections.

   > If needed, you can create a demo user like this:

```python
from datetime import date
from users.models import User, SectionPreference, AuthorPersona

User.objects.create(
    username="demo_newsreader",
    first_name="Jane",
    last_name="Doe",
    gender="f",
    birthday=date(1993, 5, 17),
    user_type="news_reader",
    password="password",
    preferred_sections=[
        SectionPreference(section_id="news", section_name="news", score=1.0),
        SectionPreference(section_id="culture", section_name="culture", score=1.0),
        SectionPreference(section_id="sport", section_name="sport", score=1.0),
    ],
    persona=AuthorPersona(
        tone="friendly",
        style="concise",
        length="medium"
    )
)
```

3. Articles have been fetched from The Guardian by running:

```bash
python manage.py fetch_articles
```

4. Highlights have been generated for the news reader using:

```bash
python manage.py generate_highlights
```

## Running the Demo

### 1. Imports and pipeline initialization

You can experiment with different voices. See the full list here: [Kokoro Voices](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md#american-english)

```python
# --- Imports ---
from kokoro import KPipeline
import soundfile as sf
import torch
import numpy as np
import io
from django.core.files.base import ContentFile
from datetime import date

# --- Initialize the text-to-speech pipeline ---
pipeline = KPipeline(lang_code='a')

# --- Set the voice to use ---
voice = 'af_heart'  # Current example voice; change if you want
```

### 2. Get a user

```python
# --- Get a user ---
# You can grab the first news reader or fetch by ID if you know it
user = User.objects.filter(user_type="news_reader").first()
if not user:
    raise ValueError("No news reader user found in the database.")
```

### 3. Get daily highlight

```python
# --- Get the most recent daily highlight from today ---
today_highlights = user.daily_highlights.filter(created_at__date=date.today()).order_by('-created_at')
if not today_highlights.exists():
    raise ValueError(f"No daily highlights found for user {user.id} today.")

highlight = today_highlights.first()

# --- Check that there are stories ---
if not highlight.stories.exists():
    raise ValueError(f"No stories found in the highlight {highlight.id}.")
```

### 4. Generate narrations

```python
# --- Loop over all stories and generate/save narration ---
for story in highlight.stories.all():
    generator = pipeline(story.body_text, voice=voice)
    audio_array = np.concatenate([audio for _, _, audio in generator])

    buffer = io.BytesIO()
    sf.write(buffer, audio_array, samplerate=24000, format="WAV")
    buffer.seek(0)

    audio_file = ContentFile(buffer.read(), name=f"{story.id}_narration.wav")
    story.narration = audio_file
    story.save()

    print(f"Narration generated and saved for story {story.id}")
```

You can log in as the user and check `/daily-highlight` on the backend to verify that the narrations exist.

## Next steps

- Implement a [custom management command](https://docs.djangoproject.com/en/5.2/howto/custom-management-commands/) to generate narrations.
- Add an audio player on the frontend.

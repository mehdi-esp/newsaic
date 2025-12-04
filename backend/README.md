# Backend

The project requires Python 3.12.

All operations should be performed from the current directory.

## Setup

### Install dependencies

```bash
pip install -r requirements.txt
```

### Environment variables

Create a `.env` file and set the following environment variables:

- `MONGODB_URI`
- `GUARDIAN_API_KEY`
- `GROQ_API_KEY`

Optional (needed if using OpenRouter embeddings):

- `EMBEDDING_BACKEND` (set to `OPENROUTER`)
- `OPENROUTER_API_KEY`

### Run migrations

```bash
python manage.py migrate
```

### Populate database with The Guardian sections

```bash
python manage.py fetch_sections
```

### Ollama

If embedding with Ollama, install it and pull the model:

```bash
ollama pull qwen3-embedding:0.6b
```

## Running

### Run server

```bash
python manage.py runserver
```

### Run tasks

**News Fetching**

```bash
python manage.py fetch_articles
```

**Article Chunk Embedding (for RAG & Semantic Search)**

```bash
python manage.py embed_article_chunks
```

**Article Embedding (for recommendations)**

```bash
python manage.py embed_articles
```

## Development

### Django shell

```bash
python manage.py shell
```

### Create a new app

```bash
python manage.py startapp app_name --template https://github.com/mongodb-labs/django-mongodb-app/archive/refs/heads/5.2.x.zip
```

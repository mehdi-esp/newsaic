# Backend

All operations should be performed from the current directory.

## Setup

### Install dependencies

Create a virtual environment (or use `direnv`), then install the dependencies:

```bash
pip install -r requirements.txt
```

### Environment variables

Create a `.env` file and set the following environment variables:

- `MONGODB_URI`
- `GUARDIAN_API_KEY`
- `GROQ_API_KEY`

### Run migrations

```bash
python manage.py migrate
```

## Running

### Run server

```bash
python manage.py runserver
```

### Run background task workers

To run both news fetching and embeddings tasks together:

```bash
celery -A newsaic worker -E -Q news_fetching,embeddings -c 1 -B -l DEBUG
```

Or run them separately:

**News Fetcher**

```bash
celery -A newsaic worker -E -Q news_fetching -c 1 -B -l DEBUG
```

**Embeddings**

```bash
celery -A newsaic worker -E -Q embeddings -c 1 -B -l DEBUG
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

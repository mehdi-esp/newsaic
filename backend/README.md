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

### Run tasks

**News Fetching**

```bash
python manage.py fetch_articles
```

**Article Embedding**

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

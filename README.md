# Newsaic

> A personalized news application. Built with React, Django Rest Framework, and MongoDB.

![](https://gist.githubusercontent.com/mehdi-esp/212d15cb06eeee28e90f8b4212e06d02/raw/5070964bafd77b7a49bf90e7a787e92827d1a154/highlights.jpg)

## Features

### Daily Highlights

A curated set of the most relevant news stories for the reader.

```mermaid
flowchart LR
    A@{ shape: docs, label: "Source Articles" }
    B[LLM Curator]
    C@{ shape: docs, label: "Highlight Ideas" }
    D[LLM Writer]
    E@{ shape: docs, label: "Highlights" }
    A --> B
    B --> C
    C --> D
    D --> E
```

Using a two-step LLM chain, source articles are first selected based on relevance and grouped into related story ideas. Each story idea is then written according to the user’s preferences for style, tone, and length.

In addition, narrations are automatically generated using [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M).

### News Feed

A personalized feed of articles based on the reader’s selected topics.

On an article page, readers can:
- View suggested articles related to the content.
- Ask questions about the article, powered by RAG.

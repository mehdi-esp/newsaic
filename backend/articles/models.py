from django.db import models
from django.conf import settings
from django_mongodb_backend.fields import EmbeddedModelField, ArrayField, EmbeddedModelArrayField
from django_mongodb_backend.models import EmbeddedModel
from django_mongodb_backend.indexes import SearchIndex, VectorSearchIndex

class Section(models.Model):
    section_id = models.CharField(max_length=100, unique=True)
    web_title = models.CharField(max_length=200)
    web_url = models.URLField()
    api_url = models.URLField()
    class Meta:
        indexes = [
            models.Index(fields=['section_id']),
        ]

    def __str__(self):
        return self.web_title


class EmbeddedTag(EmbeddedModel):
    tag_id = models.CharField(max_length=100)
    section_id = models.CharField(max_length=100, blank=True, null=True)
    section_name = models.CharField(max_length=100, blank=True, null=True)
    web_title = models.CharField(max_length=200)
    web_url = models.URLField()
    api_url = models.URLField()

    def __str__(self):
        return self.web_title


class EmbeddedContributor(EmbeddedModel):
    contributor_id = models.CharField(max_length=255)
    web_title = models.CharField(max_length=255)
    web_url = models.URLField()
    api_url = models.URLField()
    bio = models.TextField(blank=True, null=True)
    byline_image_url = models.URLField(blank=True, null=True)
    byline_large_image_url = models.URLField(blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    twitter_handle = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.web_title


class Article(models.Model):
    guardian_id = models.CharField(max_length=255, unique=True)
    section_id = models.CharField(max_length=100, blank=True, null=True)
    section_name = models.CharField(max_length=100, blank=True, null=True)
    web_title = models.CharField(max_length=255)
    web_url = models.URLField()
    api_url = models.URLField()
    headline = models.CharField(max_length=255, blank=True, null=True)
    trail_text = models.TextField(blank=True, null=True)
    body_text = models.TextField(blank=True, null=True)
    thumbnail = models.URLField(blank=True, null=True)
    first_publication_date = models.DateTimeField(blank=True, null=True)
    last_modified = models.DateTimeField(blank=True, null=True)
    embedding = ArrayField(models.FloatField(),size=1024, blank=True, null=True)
    tags = EmbeddedModelArrayField(EmbeddedTag, blank=True, default=list)  # Embedded tags
    authors = EmbeddedModelArrayField(EmbeddedContributor, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.web_title

    @classmethod
    def from_guardian_result(cls, item):
        """
        Create an Article instance (unsaved) from a Guardian API article JSON.
        Includes embedded keyword tags and contributor details if available.
        """
        fields = item.get("fields", {})
        tags_data = item.get("tags", [])

        embedded_tags = []
        contributors = []

        for tag in tags_data:
            tag_type = tag.get("type")
            if tag_type == "contributor":
                contributors.append(
                    EmbeddedContributor(
                        contributor_id=tag.get("id"),
                        web_title=tag.get("webTitle"),
                        web_url=tag.get("webUrl"),
                        api_url=tag.get("apiUrl"),
                        bio=tag.get("bio"),
                        byline_image_url=tag.get("bylineImageUrl"),
                        byline_large_image_url=tag.get("bylineLargeImageUrl"),
                        first_name=tag.get("firstName"),
                        last_name=tag.get("lastName"),
                        twitter_handle=tag.get("twitterHandle"),
                    )
                )
            elif tag_type == "keyword":
                embedded_tags.append(
                    EmbeddedTag(
                        tag_id=tag.get("id"),
                        section_id=tag.get("sectionId"),
                        section_name=tag.get("sectionName"),
                        web_title=tag.get("webTitle"),
                        web_url=tag.get("webUrl"),
                        api_url=tag.get("apiUrl"),
                    )
                )

        return cls(
            guardian_id=item.get("id"),
            section_id=item.get("sectionId"),
            section_name=item.get("sectionName"),
            web_title=item.get("webTitle"),
            web_url=item.get("webUrl"),
            api_url=item.get("apiUrl"),
            headline=fields.get("headline"),
            trail_text=fields.get("trailText"),
            body_text=fields.get("bodyText"),
            thumbnail=fields.get("thumbnail"),
            first_publication_date=item.get("webPublicationDate"),
            last_modified=fields.get("lastModified"),
            tags=embedded_tags,
            authors=contributors,
        )

    class Meta:
        indexes = [
            models.Index(fields=['section_id']),
            models.Index(fields=['first_publication_date']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_modified']),
            VectorSearchIndex(name="text_search_index", fields=["embedding"], similarities=["cosine"])
        ]


class Chunk(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    embedding = ArrayField(models.FloatField(), size=1024)

    class Meta:
        unique_together=['article', 'chunk_index']
        indexes = [
            VectorSearchIndex(name="chunk_search_index", fields=["embedding"], similarities=["cosine"])
        ]

    def __str__(self):
        return f'Chunk {self.chunk_index} of {self.article.web_title}'
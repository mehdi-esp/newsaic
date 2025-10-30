from django.db import models
from articles.models import Article
from users.models import User, AuthorPersona
from django_mongodb_backend.fields import EmbeddedModelField

class DailyHighlight(models.Model):
    user = models.ForeignKey(User, related_name="daily_highlights", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    day = models.DateField(auto_now_add=True) # unused for now

    persona_snapshot = EmbeddedModelField(AuthorPersona)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at'])
        ]

    def __str__(self):
        stories_count = self.stories.count()
        return f"Highlights for {self.user.username} on {self.created_at.date()} ({stories_count} stories)"

class Story(models.Model):
    daily_highlight = models.ForeignKey(
        DailyHighlight,
        related_name="stories",
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=512)
    body_text = models.TextField()

    source_articles = models.ManyToManyField(Article)

    order = models.PositiveIntegerField()
    narration = models.FileField(upload_to="story_narrations/", blank=True, null=True)

    class Meta:
        ordering = ['order']
        unique_together = ('daily_highlight', 'order')

    def __str__(self):
        source_count = self.source_articles.count()
        return f"{self.title} ({source_count} source articles)"
from django.db import models
from django.conf import settings
from django_mongodb_backend.fields import EmbeddedModelField, ArrayField, EmbeddedModelArrayField
from django_mongodb_backend.models import EmbeddedModel
from django.contrib.auth.models import AbstractUser
from articles.models import EmbeddedTag, Section, Article

# Create your models here.

class SectionPreference(EmbeddedModel):
    section_id = models.CharField(max_length=100, blank=True)
    section_name = models.CharField(max_length=100, blank=True)
    score = models.FloatField(default=0.0)

class AuthorPersona(EmbeddedModel):
    tone = models.CharField(max_length=100, blank=True, null=True)
    style = models.CharField(max_length=100, blank=True, null=True)
    length = models.CharField(max_length=100, blank=True, null=True)
    extra_instructions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Persona(tone={self.tone}, style={self.style}, length={self.length})"

class UserType(models.TextChoices):
    READER = 'news_reader', 'News Reader'
    ADMIN = 'admin', 'Admin'

class Gender(models.TextChoices):
    MALE = 'm', 'Male'
    FEMALE = 'f', 'Female'

class User(AbstractUser):
    persona = EmbeddedModelField(AuthorPersona, blank=True, null=True)
    preferred_sections = EmbeddedModelArrayField(SectionPreference, blank=True, null=True)
    birthday = models.DateField()
    user_type = models.CharField(
        max_length=11,
        choices=UserType.choices
    )
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices
    )

    def __str__(self):
        return self.username


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'article')

from rest_framework import serializers
import json

from .models import Article, Section


class SectionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class ArticleSerializer(serializers.HyperlinkedModelSerializer):
    tags = serializers.SerializerMethodField()
    authors = serializers.SerializerMethodField()
    bookmarked = serializers.SerializerMethodField()

    def get_bookmarked(self, obj):
        ids = self.context.get('bookmark_ids', set())
        return obj.id in ids if ids else None

    class Meta:
        model = Article
        exclude = ('embedding', )

    def get_tags(self, obj):
        if obj.tags:
            return [tag.web_title for tag in obj.tags]
        return []

    def get_authors(self, obj):
        if obj.authors:
            return [author.web_title or f"{author.first_name} {author.last_name}" for author in obj.authors]
        return []
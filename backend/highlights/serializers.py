from rest_framework import serializers
from articles.models import Article
from articles.serializers import ArticleSerializer
from highlights.models import Story, DailyHighlight


class StorySerializer(serializers.HyperlinkedModelSerializer):
    source_articles = ArticleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Story
        fields = ["url", "title", "body_text", "order", "narration", "source_articles"]

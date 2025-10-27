from rest_framework import serializers
from articles.models import Article
from highlights.models import Story, DailyHighlight


class StorySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Story
        fields = ["url", "title", "body_text", "order", "source_articles"]

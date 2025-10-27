from rest_framework import serializers
import json

from .models import Article

class ArticleSerializer(serializers.HyperlinkedModelSerializer):
    tags = serializers.SerializerMethodField()
    authors = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = '__all__'
    
    def get_tags(self, obj):
        if obj.tags:
            return [tag.web_title for tag in obj.tags]
        return []
    
    def get_authors(self, obj):
        if obj.authors:
            return [author.web_title or f"{author.first_name} {author.last_name}" for author in obj.authors]
        return []
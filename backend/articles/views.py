# articles/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
import requests
import ollama # Keep this import
from rest_framework.decorators import api_view

from .models import Article, Section, Chunk # Ensure these models are correctly imported
from users.models import Bookmark, User, UserType # Ensure these models are correctly imported
from .serializers import ArticleSerializer, SectionSerializer
from users.permissions import BookmarkPermission
from django_mongodb_backend.expressions import SearchVector # Ensure this is correct for your MongoDB setup

# --- OLLAMA CONFIGURATION ---
OLLAMA_EMBEDDING_MODEL = "qwen3-embedding:0.6B" 
OLLAMA_API_URL = "http://localhost:11434/api/embeddings" 

def get_ollama_embedding(text):
    """Generates an embedding vector using the local Ollama API via direct HTTP request."""
    payload = {
        "model": OLLAMA_EMBEDDING_MODEL,
        "prompt": text,
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("embedding") 
    except requests.exceptions.RequestException as e:
        print(f"Ollama API Error (Falling back to keyword search): {e}")
        return None

# --- PAGINATION CLASS ---
class SearchPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# --- VIEWS ---

class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    pagination_class = SearchPagination 

    def get_queryset(self):
        # Semantic Search Query
        if query := self.request.query_params.get('q'):
            
            # Use the ollama client library for simplified vector generation
            try:
                # FIX: Use positional arguments and access the common ['embeddings'][0] key structure.
                response = ollama.embed(
                    OLLAMA_EMBEDDING_MODEL,
                    query
                )
                embedded_query = response['embeddings'][0] 

            except Exception as e:
                print(f"Ollama embedding failed for query '{query}': {e}")
                return Article.objects.none()

            # Perform Vector Search
            results = Chunk.objects.annotate(
                score=SearchVector(
                    path="embedding",
                    query_vector=embedded_query,
                    limit=20,
                    num_candidates=150,
                )
            ).order_by('-score').only("article_id")

            # Deduplicate and Rank Articles
            seen_article_ids = set()
            sorted_article_ids = []
            
            for article_id in results.values_list("article_id", flat=True):
                if article_id not in seen_article_ids:
                    seen_article_ids.add(article_id)
                    sorted_article_ids.append(article_id)
            
            articles_dict = Article.objects.in_bulk(sorted_article_ids)
            
            ranked_articles = [
                articles_dict[a_id] 
                for a_id in sorted_article_ids 
                if a_id in articles_dict
            ]
            
            return ranked_articles

        # Default/Personalized Feed Fallback
        if self.request.user.is_authenticated:
            user: User = self.request.user
            if user.user_type == UserType.ADMIN:
                return Article.objects.all()

            section_ids = [s.section_id for s in user.preferred_sections]
            return Article.objects.filter(section_id__in=section_ids).order_by('-first_publication_date')
        
        # Default view for anonymous users/general feed
        return Article.objects.all().order_by('-first_publication_date')


    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[BookmarkPermission])
    def bookmark(self, request, pk=None):
        article = self.get_object()
        user = request.user
        bookmark = Bookmark.objects.filter(user=user, article=article).first()

        if request.method == 'GET':
            return Response({"bookmarked": bool(bookmark)}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            if bookmark:
                return Response({"bookmarked": True, "detail": "Already bookmarked"}, status=status.HTTP_200_OK)
            Bookmark.objects.create(user=user, article=article)
            return Response({"bookmarked": True, "detail": "Article bookmarked"}, status=status.HTTP_201_CREATED)

        elif request.method == 'DELETE':
            if bookmark:
                bookmark.delete()
                return Response({"bookmarked": False, "detail": "Bookmark removed"}, status=status.HTTP_200_OK)
            return Response({"bookmarked": False, "detail": "No bookmark found"}, status=status.HTTP_400_BAD_REQUEST)

class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [AllowAny]
    queryset = Section.objects.all()
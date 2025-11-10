from rest_framework import viewsets
from .models import Article, Section, Chunk
from users.models import Bookmark, User, UserType
from .serializers import ArticleSerializer, SectionSerializer
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from users.permissions import BookmarkPermission
from django_mongodb_backend.expressions import SearchVector
from utils.embeddings import embed
from .qa_pipeline import run_article_qa_pipeline
import traceback

class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated and user.user_type == UserType.READER:
            ctx['bookmark_ids'] = set(
                user.bookmark_set.values_list('article_id', flat=True)
            )
        return ctx

    def get_queryset(self):

        if query := self.request.query_params.get('q'):
            embedded_query = embed([query])[0]

            results = Chunk.objects.annotate(
                score=SearchVector(
                    path="embedding",
                    query_vector=embedded_query,
                    limit=20,
                    num_candidates=150,
                )
            ).order_by("-score").only("article_id") # This is the default behavior.

            # Keep first (highest scored) chunk per article
            seen_article_ids = set()
            sorted_article_ids = []
            for article_id, score in results.values_list("article_id", "score"):
                if article_id not in seen_article_ids:
                    seen_article_ids.add(article_id)
                    sorted_article_ids.append(article_id)

            articles_dict = Article.objects.in_bulk(sorted_article_ids)

            ranked_articles = [articles_dict[a_id] for a_id in sorted_article_ids if a_id in articles_dict]

            return ranked_articles

        if self.request.user.is_authenticated:
            user: User = self.request.user

            preferred = "preferred" in self.request.query_params and self.request.query_params["preferred"].lower() == "true"

            if user.user_type == UserType.ADMIN:
                return Article.objects.all().order_by("-first_publication_date")

            if user.user_type == UserType.READER and preferred:
                section_ids = [s.section_id for s in user.preferred_sections]
                return Article.objects.filter(section_id__in=section_ids).order_by("-first_publication_date")

        return Article.objects.all().order_by("-first_publication_date")

    @action(detail=True, methods=["get"], url_path="similar")
    def similar_articles(self, request, pk=None):
        """
        Return the 3 most similar articles (vector similarity)
        excluding the article itself.
        """
        article = self.get_object()  # 404 if article does not exist
        if not article.embedding:
            return Response(
                {"detail": "This article has no embedding."},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = (
            Article.objects.exclude(id=article.id)  # do not recommend itself
            .annotate(
                score=SearchVector(
                    path="embedding",
                    query_vector=article.embedding,
                    limit=4,
                    num_candidates=150,
                )
            )
            .order_by("-score")
        )

        top_three = results

        serializer = self.get_serializer(top_three, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[BookmarkPermission])
    def bookmark(self, request, pk=None):
        """
        GET: Check if bookmarked
        POST: Add bookmark
        DELETE: Remove bookmark
        """
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
        
    @action(detail=True, methods=["post"], url_path="qa")
    def qa(self, request, pk=None):
        question = request.data.get("question")
        if not question:
            return Response({"error": "Missing question"}, status=status.HTTP_400_BAD_REQUEST)

        article = self.get_object()
        try:
            result = run_article_qa_pipeline(request.user, article=article, question=question)
            return Response({
                "answer": result.answer,
                "used_chunks": result.used_chunks
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print("Error in QA pipeline:", str(e))
            traceback.print_exc()
            return Response({"error": "Internal server error while processing question."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [AllowAny]
    queryset = Section.objects.all()
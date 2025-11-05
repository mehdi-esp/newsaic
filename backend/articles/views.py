from rest_framework import viewsets
from .models import Article, Section
from users.models import Bookmark, User, UserType
from .serializers import ArticleSerializer, SectionSerializer
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from users.permissions import BookmarkPermission
from django_mongodb_backend.expressions import SearchVector


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            user: User = self.request.user
            if user.user_type == UserType.ADMIN:
                return Article.objects.all()

            section_ids = [s.section_id for s in user.preferred_sections]
            return Article.objects.filter(section_id__in=section_ids)

        return Article.objects.all()

    @action(detail=True, methods=["get"])
    def recommended_articles(self, request, pk=None):
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

class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [AllowAny]
    queryset = Section.objects.all()
from rest_framework import viewsets
from .models import Article
from users.models import Bookmark, User, UserType
from .serializers import ArticleSerializer
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from users.permissions import BookmarkPermission


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
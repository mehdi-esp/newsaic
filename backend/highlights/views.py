from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from highlights.models import DailyHighlight
from users.permissions import IsNewsReader
from .serializers import StorySerializer
from .models import Story
from rest_framework_extensions.cache.decorators import cache_response


def highlight_key_func(view_instance, view_method, request, args, kwargs):
    """
    Build a cache key that changes when the user's latest highlight changes.
    """
    user = request.user
    latest = (
        DailyHighlight.objects.filter(user=user)
        .order_by("-created_at")
        .only("created_at")
        .first()
    )
    stamp = latest.created_at.timestamp() if latest else "none"
    return f"highlight:{user.pk}:{stamp}"


class StoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns stories from the most recent DailyHighlight of the requesting user.
    """

    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated, IsNewsReader]

    def get_queryset(self):
        user = self.request.user
        # Get the most recent highlight for the user
        latest_highlight = (
            DailyHighlight.objects.filter(user=user).order_by("-created_at").first()
        )
        if latest_highlight:
            # Return the related stories in order
            return latest_highlight.stories.all()
        # No highlight yet
        return Story.objects.none()

    @cache_response(timeout=60 * 60 * 2, key_func=highlight_key_func)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
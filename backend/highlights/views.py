from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from highlights.models import DailyHighlight
from users.permissions import IsNewsReader
from .serializers import StorySerializer  # , DailyHighlightSerializer
from .models import Story


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

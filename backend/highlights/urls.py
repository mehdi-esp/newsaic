from rest_framework.routers import DefaultRouter
from highlights.views import StoryViewSet

router = DefaultRouter()
router.register(r"daily-highlight", StoryViewSet, basename="story")

urlpatterns = router.urls

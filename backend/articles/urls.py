# newsaic/backend/articles/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ArticleViewSet, SectionViewSet

router = DefaultRouter()
# 1. Register the more specific paths first
router.register(r'sections', SectionViewSet, basename='section') 

# 2. Register the root path last
router.register(r'', ArticleViewSet, basename='article') 

urlpatterns = [
 path('', include(router.urls)),
]
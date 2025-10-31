from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ArticleViewSet, SectionViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'sections', SectionViewSet, basename='section')

urlpatterns = [
    path('', include(router.urls)),
]
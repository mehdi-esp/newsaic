from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import UserViewSet, BookmarkViewSet, MyProfileView

router = DefaultRouter()
router.register(r'users',     UserViewSet,     basename='user')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MyProfileView.as_view(), name='my-profile')
]
# users/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import UserViewSet, BookmarkViewSet, MyProfileView, MyPersonaView, MySectionPreferencesView, ReaderRegisterView, LoginView, LogoutView

router = DefaultRouter()
router.register(r'users',     UserViewSet,     basename='user')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MyProfileView.as_view(), name='my-profile'),
    path('me/persona/', MyPersonaView.as_view(), name='my-persona'),
    path('me/sections/', MySectionPreferencesView.as_view(), name='my-preferences'),
    path('register/', ReaderRegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
]
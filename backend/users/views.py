from rest_framework import views, viewsets, generics, mixins, permissions, status
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Bookmark
from .serializers import UserSerializer, BookmarkSerializer, AuthorPersonaSerializer, ReaderSectionPreferencesSerializer, ReaderRegisterSerializer
from .permissions import IsNewsReader, IsAdmin, IsAnonymous

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()

class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MyPersonaView(generics.RetrieveUpdateAPIView):
    serializer_class = AuthorPersonaSerializer
    permission_classes = [permissions.IsAuthenticated, IsNewsReader]

    def get_object(self):
        user: User = self.request.user
        return user.persona

    def perform_update(self, serializer):
        user: User = self.request.user
        user.persona = serializer.save()
        user.save()

class MySectionPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = ReaderSectionPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated, IsNewsReader]

    queryset = User.objects.all()

    def get_object(self):
        return self.request.user

class BookmarkViewSet(mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated, IsNewsReader] # Admins cannot see bookmarks for now

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

class ReaderRegisterView(generics.CreateAPIView):
    serializer_class = ReaderRegisterSerializer
    permission_classes = [IsAnonymous]

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            django_login(request, user)
            serializer = UserSerializer(user)
            return Response({'success': True, 'user': serializer.data})
        return Response({'success': False, 'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        django_logout(request)
        return Response({'success': True})
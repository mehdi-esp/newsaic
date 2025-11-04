# newsaic/urls.py (New Content)

from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

# Import necessary DRF components for the API Root view
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

# --- NEW: API Root View ---
@api_view(['GET'])
def api_root(request, format=None):
    """
    The root endpoint of the NewsAIc API.
    Provides links to the main application endpoints.
    """
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'articles': reverse('article-list', request=request, format=format),
        'sections': reverse('section-list', request=request, format=format),
    })
# --- END NEW VIEW ---


urlpatterns = [
    # 📌 FIX: Handles the root URL (http://127.0.0.1:8000/)
    path("", api_root, name='api-root'), 
    
    path("admin/", admin.site.urls),
    
    # 1. Use the DRF Browsable API's authentication views
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    
    # 2. Give 'articles' a clear prefix
    path('articles/', include('articles.urls')),
    
    # 3. Give 'highlights' a clear prefix
    path('highlights/', include('highlights.urls')),
    
    # 4. Give 'users' (which contains /login/, /me/, etc.) a clear prefix
    path('users/', include('users.urls')), 
]

# Media URL configuration for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
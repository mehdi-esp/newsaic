from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import UserType

class IsNewsReader(BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == UserType.READER

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == UserType.ADMIN


class BookmarkPermission(BasePermission):
    """
    News readers can create/delete bookmarks.
    Admins can only read (GET) bookmarks.
    """
    def has_permission(self, request, view):
        if request.user.user_type == UserType.READER:
            return True
        if request.user.user_type == UserType.ADMIN:
            return request.method in SAFE_METHODS
        return False
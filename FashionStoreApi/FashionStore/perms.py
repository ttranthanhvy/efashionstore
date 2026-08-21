from rest_framework.permissions import BasePermission
from .models import User


class Isadmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "STAFF"


class IsCustomer:
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CUSTOMER"


class IsAdminOrStaff:
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["ADMIN", "STAFF"]

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.STAFF]

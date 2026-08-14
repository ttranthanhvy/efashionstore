from rest_framework.permissions import BasePermission

class Isadmin(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenicated and request.user.role == "ADMIN")

class IsStaff(BasePermission): 
    def has_permission(self, request, view):
        return (request.user.is_authenicated and request.user.role == "STAFF")

class IsCustomer():
    def has_permission(self, request, view):
        return (request.user.is_authenicated and request.user.role == "CUSTOMER")


class IsAdminOrCustomer():
    def has_permission(self, request, view):
        return (request.user.is_authenicated and request.user.role in ["ADMIN", "STAFF"])
    
  

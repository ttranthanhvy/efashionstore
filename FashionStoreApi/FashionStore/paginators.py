from rest_framework import pagination

class UserPagination(pagination.PageNumberPagination):
    page_size = 20
    
class ProductPagination(pagination.PageNumberPagination):
    page_size = 20

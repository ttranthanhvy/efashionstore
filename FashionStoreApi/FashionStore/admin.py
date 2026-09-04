from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import (
    User,
    Category,
    Product,
    ProductVariant,
    Rating,
)
from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path


from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path


class MyAdminSite(admin.AdminSite):
    site_header = "Fashion Store"
    site_title = "Fashion Store Admin"
    index_title = "Dashboard"

    def index(self, request, extra_context=None):
        return TemplateResponse(request, "admin/dashboard.html")

    def get_urls(self):
        urls = [
            path("users/", self.users),
            path("staffs/", self.staff),
            path("categories/", self.categories),
        ]

        return urls + super().get_urls()

    def users(self, request):
        return TemplateResponse(request, "admin/users.html")

    def staff(self, request):
        return TemplateResponse(request, "admin/staffs.html")

    def categories(self, request):
        return TemplateResponse(request, "admin/categories.html")


admin_site = MyAdminSite(name="fashion_admin")


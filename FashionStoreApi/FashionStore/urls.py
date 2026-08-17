from django.urls import path, include
from FashionStore import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()

router.register("secure", views.ProfileViewSet, basename="profile")
router.register("secure/admin/users", views.UserViewSet, basename="user")
router.register("secure/admin/staffs", views.StaffViewset, basename="staff")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),

]

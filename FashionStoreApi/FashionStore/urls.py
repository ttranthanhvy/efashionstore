from django.urls import path, include
from FashionStore import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()

router.register("secure", views.ProfileViewSet, basename="profile")
router.register("secure/admin/users", views.UserViewSet, basename="user")
router.register("secure/admin/staffs", views.StaffViewset, basename="staff")
router.register("category", views.CategoryViewset, basename="category")
router.register("secure/admin/category", views.AdminCategoryViewset, basename="admin-category")
router.register("product", views.ProductViewset, basename="product")
router.register("secure/staff/product", views.StaffProductViewset, basename="staff-product")
router.register("variant", views.VariantViewset, basename="variant")
router.register("secure/staff/variant", views.StaffVariantViewset, basename="satff-variant")
router.register("secure/cart", views.CartViewSet, basename="cart")
router.register("secure/cart/items", views.CartItemviewset, basename="cart-item")
router.register("secure/ratings", views.RatingViewSet, basename="rating")
router.register("secure/orders", views.OrderViewSet, basename="order")
router.register("secure/staff/orders", views.StaffOrderViewSet, basename="staff-order")
router.register("secure/admin/dashboard", views.AdminDashboardViewSet, basename="dasboard")




urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("secure/payments/vnpay/", views.VNPayCreatePaymentView.as_view(), name="vnpay-create-payment"),
    path("payments/vnpay/callback/", views.VNPayCallbackView.as_view(), name="vnpay-callback"),
]

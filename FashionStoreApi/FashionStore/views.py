from django.shortcuts import render
from rest_framework import generics, permissions, parsers, status, viewsets, filters
from rest_framework.decorators import action
from .models import User, Category, Product, ProductVariant
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from FashionStore import serializers, perms, paginators
from django.db import models


# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]


class LoginView(TokenObtainPairView):
    serializer_class = serializers.LoginSerializer


class LogoutView(generics.GenericAPIView):
    serializer_class = serializers.LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get", "patch"], url_path="profile")
    def profile(self, request):

        if request.method.__eq__("GET"):
            serializer = serializers.ProfileSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = serializers.ProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializers.ProfileSerializer(request.user).data, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["patch"], url_path="change-password")
    def change_password(self, request):
        serializer = serializers.ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["newPassword"])
        request.user.save()

        return Response(
            {"message": "Password changed successfully."}, status=status.HTTP_200_OK
        )


class UserViewSet(viewsets.ViewSet):
    permission_classes = [perms.Isadmin]

    def list(self, request):
        users = User.objects.filter(role=User.Role.CUSTOMER)
        p = paginators.UserPagination()
        page = p.paginate_queryset(users, request)
        if page is not None:
            serializer = serializers.UserSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)
        serializer = serializers.UserSerializer(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        s = serializers.UserSerializer(user)
        return Response(s.data, status=status.HTTP_200_OK)

    @action(methods=["patch"], detail=True, url_path="active")
    def active(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = serializers.UserActiveSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffViewset(viewsets.ViewSet):
    permission_classes = [perms.Isadmin]

    def create(self, resquest):
        serializer = serializers.StaffSerializer(data=resquest.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request):
        users = User.objects.filter(role=User.Role.STAFF)
        p = paginators.UserPagination()
        page = p.paginate_queryset(users, request)
        if page is not None:
            serializer = serializers.StaffSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)
        serializer = serializers.StaffSerializer(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["get"], detail=False, url_path="pending")
    def pending(self, request):
        staffs = User.objects.filter(role=User.Role.STAFF, is_approved=False)
        serializer = serializers.StaffSerializer(staffs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["patch"], detail=True, url_path="reject")
    def approve(self, request, pk):
        try:
            staff = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "Staff not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = serializers.UserActiveSerializer(
            staff, data=request.data, partial=True, context={"request": request}
        )
        staff.is_approved = False
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoryViewset(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.CategoryDetailSerializer
        return serializers.CategorySerializer


class AdminCategoryViewset(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer
    permission_classes = [perms.Isadmin]
    http_method_names = ["post", "patch", "delete"]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.is_active = False
        category.save(update_fields=["is_active"])

        return Response(
            {"detail": "Category deteled successfully"}, status=status.HTTP_200_OK
        )


class ProductViewset(
    viewsets.GenericViewSet, generics.ListAPIView, generics.RetrieveAPIView
):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = serializers.ProductSerializer
    pagination_class = paginators.ProductPagination
    permission_classes = [permissions.AllowAny]

    def paginate(self, products):
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = serializers.ProductSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = serializers.ProductSerializer(products, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["get"], detail=False, url_path="search")
    def search(self, resquest):
        q = self.request.query_params.get("q")
        if not q:
            return Response(
                {"detail": "Query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        products = self.queryset.filter(name__icontains=q)
        return self.paginate(products)

    @action(methods=["get"], detail=False, url_path="new")
    def new_products(self, request):
        products = self.queryset.order_by("-created_date")
        return self.paginate(products)

    @action(methods=["get"], detail=False, url_path="popular")
    def popular_products(self, request):
        products = self.queryset.order_by("-quantity_sold")
        return self.paginate(products)

    @action(methods=["get"], detail=True, url_path="variants")
    def variant(self, request, pk):
        product = self.get_object()
        variants = ProductVariant.objects.filter(product=product)
        serializer = serializers.VariantSerializer(variants, many=True)

        return Response(serializer.data)


class VariantViewset(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = ProductVariant.objects.filter(is_active=True)
    serializer_class = serializers.VariantSerializer
    permission_classes = [permissions.AllowAny]


class StaffProductViewset(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = serializers.ProductSerializer
    permission_classes = [perms.IsAdminOrStaff]
    http_method_names = ["post", "patch", "delete"]

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active"])

        return Response(
            {"detail": "Product deteled successfully"}, status=status.HTTP_200_OK
        )

    @action(methods=["post"], detail=True, url_path="variants")
    def create_variant(self, request, pk=None):
        product = self.get_object()
        color = request.data.get("color")
        size = request.data.get("size")
        if ProductVariant.objects.filter(
            product=product, color=color, size=size
        ).exists():
            return Response(
                {"detail": "Variant with this color and size already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = serializers.VariantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StaffVariantViewset(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = serializers.VariantSerializer
    permission_classes = [perms.IsAdminOrStaff]
    http_method_names = ["get","patch", "delete"]

    def partial_update(self, request, *args, **kwargs):
        variant = self.get_object()
        color = request.data.get("color", variant.color)
        size = request.data.get("size", variant.size)

        if (ProductVariant.objects.filter(product=variant.product, color=color, size=size).exclude(id=variant.id).exists()):
            return Response(
                {"detail": "Another variant with this color and size already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    @action(methods=["patch"], detail=True, url_path="inventory")
    def update_inventory(self, request, pk=None):
        variant = self.get_object()
        quantity = request.data.get("quantity")
        if quantity is None:
            return Response(
                {"detail": "Quantity is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if quantity <= 0:
            return Response(
                {"detail": "Quantity must be greater than 0."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        variant.stock += quantity
        variant.save(update_fields=["stock"])

        return Response(
            {"detail": "Inventory updated successfully."}, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        variant = self.get_object()
        variant.is_active = False
        variant.save(update_fields=["is_active"])

        return Response(
            {"detail": "Variant deteled successfully"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], url_path="restock")
    def restock(self, request):
        variants = ProductVariant.objects.filter(
            stock__lte=models.F("min_stock")
        ).select_related("product")
        serializer = serializers.VariantSerializer(variants, many=True)

        return Response({"count": variants.count(), "results": serializer.data})


class CartViewSet(viewsets.ViewSet):
    serializer_class = serializers.CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        cart = Cart.objects.get(user=request.user)
        serializer = self.serializer_class(cart)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["post"], detail=False, url_path="items")
    def add_item(self, request):
        variant_id = request.data.get("product_variant")
        quantity = request.data.get("quantity")

        cart = Cart.objects.get(user=request.user)
        variant = ProductVariant.objects.get(id=variant_id)

        cart_item = CartItem.objects.filter(cart=cart, product_variant=variant).first()
        current_quantity = cart_item.quantity if cart_item else 0
        total_quantity = current_quantity + quantity

        if total_quantity > variant.stock:
            return Response(
                {"detail": "Quantity is out of stock."}, status=status.HTTP_409_CONFLICT
            )
        if cart_item:
            cart_item.quantity = total_quantity
            cart_item.save(update_fields=["quantity"])
        else:
            cart_item = CartItem.objects.create(
                cart=cart, product_variant=variant, quantity=quantity
            )
        serializer = serializers.CartItemSerializer(cart_item)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

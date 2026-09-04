from django.shortcuts import render
from rest_framework import generics, permissions, parsers, status, viewsets, filters
from rest_framework.decorators import action
from .models import (
    User,
    Category,
    Product,
    ProductVariant,
    Cart,
    CartItem,
    Rating,
    Order,
    OrderDetail,
    Payment,
)
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from FashionStore import serializers, perms, paginators, services
from django.db import models, transaction
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from decimal import Decimal, InvalidOperation

from .vnpay import verify_vnpay_signature, build_vnpay_payment_url


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


    @action(methods=["patch"], detail=True, url_path="reject")
    def reject(self, request, pk):
        try:
            staff = User.objects.get(
                pk=pk,
                role=User.Role.STAFF
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Staff not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        staff.is_approved = False
        staff.save(update_fields=["is_approved"])
        return Response({"detail": "Staff rejected successfully."}, status=status.HTTP_200_OK)


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
    http_method_names = ["get", "post", "patch", "delete"]

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

    @action(methods=["get"], detail=True, url_path="ratings")
    def ratings(self, request, pk):
        ratings = (
            self.get_object()
            .rating_set.select_related("user")
            .all()
            .order_by("-created_date")
        )

        p = paginators.RatingPagination()
        page = p.paginate_queryset(ratings, request)

        if page is not None:
            serializer = serializers.RatingSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)

        return Response(
            serializers.RatingSerializer(ratings, many=True).data,
            status=status.HTTP_200_OK,
        )


class VariantViewset(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = ProductVariant.objects.filter(is_active=True)
    serializer_class = serializers.VariantSerializer
    permission_classes = [permissions.AllowAny]

    @action(
        detail=True,
        methods=["post"],
        url_path="orders",
        permission_classes=[perms.IsCustomer],
    )
    @transaction.atomic
    def create_order(self, request, pk=None):

        serializer = serializers.CreateOrderFromCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data["quantity"]
        shipping_address = serializer.validated_data["shipping_address"]
        payment_method = serializer.validated_data["payment_method"]

        try:
            variant = ProductVariant.objects.select_related("product").get(pk=pk)
        except ProductVariant.DoesNotExist:
            return Response(
                {"detail": "Product variant not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order = services.create_order(
                user=request.user,
                variant=variant,
                quantity=quantity,
                shipping_address=shipping_address,
                payment_method=payment_method,
            )
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Order created successfully.",
                "order_id": order.id,
                "total_amount": order.total_amount,
                "status": order.status,
            },
            status=status.HTTP_201_CREATED,
        )


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
    http_method_names = ["get", "patch", "delete"]

    def partial_update(self, request, *args, **kwargs):
        variant = self.get_object()
        color = request.data.get("color", variant.color)
        size = request.data.get("size", variant.size)

        if (
            ProductVariant.objects.filter(
                product=variant.product, color=color, size=size
            )
            .exclude(id=variant.id)
            .exists()
        ):
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

    @action(methods=["delete"], detail=True, url_path="clear")
    def clear_cart(self, request, pk=None):
        cart = Cart.objects.get(id=pk, user=request.user)

        CartItem.objects.filter(cart=cart).delete()

        return Response(
            {"detail": "Cart cleared successfully."}, status=status.HTTP_204_NO_CONTENT
        )


class CartItemviewset(viewsets.ModelViewSet):
    serializer_class = serializers.CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch", "delete"]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def partial_update(self, request, pk=None):
        cart = Cart.objects.get(user=request.user)
        cart_item = CartItem.objects.get(id=pk, cart=cart)
        quantity = int(request.data.get("quantity"))
        variant_id = request.data.get("product_variant")

        if variant_id:
            variant = ProductVariant.objects.get(id=variant_id)
            if quantity > variant.stock:
                return Response(
                    {"detail": "Quantity is out of stock."},
                    status=status.HTTP_409_CONFLICT,
                )
            cart_item.product_variant = variant
        else:
            if quantity > cart_item.product_variant.stock:
                return Response(
                    {"detail": "Quantity is out of stock."},
                    status=status.HTTP_409_CONFLICT,
                )
        cart_item.quantity = quantity
        cart_item.save()
        return Response(
            {
                "id": cart_item.id,
                "product_variant": cart_item.product_variant.id,
                "quantity": cart_item.quantity,
            },
            status=status.HTTP_200_OK,
        )


class RatingViewSet(viewsets.ViewSet, generics.DestroyAPIView):
    queryset = Rating.objects.all()
    serializer_class = serializers.RatingSerializer
    permission_classes = [perms.RatingtOwner]
    http_method_names = ["post", "patch", "delete"]

    def create(self, request):
        data = {
            "rate": request.data.get("rate"),
            "title": request.data.get("title"),
            "comment": request.data.get("comment"),
            "user": request.user.pk,
            "product": request.data.get("product"),
        }

        serializer = serializers.RatingSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        if Rating.objects.filter(user=request.user, product=product).exists():
            return Response(
                {"detail": "You're already rating this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = serializer.save(user=request.user)

        return Response(
            serializers.RatingSerializer(rating).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, pk=None):
        rating = Rating.objects.get(pk=pk)
        self.check_object_permissions(request, rating)
        serializer = serializers.RatingSerializer(
            rating, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        rating = serializer.save()

        return Response(
            serializers.RatingSerializer(rating).data, status=status.HTTP_200_OK
        )


class OrderViewSet(viewsets.ViewSet):
    permission_classes = [perms.IsCustomer]

    def list(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-created_date")
        order_status = request.query_params.get("status")

        if order_status == "UNCOMPLETED":
            orders = orders.exclude(
                status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]
            )
        elif order_status:
            if order_status not in Order.Status.values:
                return Response(
                    {"detail": "Invalid order status."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            orders = orders.filter(status=order_status)

        return Response(serializers.OrderSerializer(orders, many=True).data)

    def retrieve(self, request, pk=None):
        order = Order.objects.filter(id=pk, user=request.user).first()

        if not order:
            return Response(
                {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(serializers.OrderSerializer(order).data)

    @action(methods=["patch"], detail=True, url_path="cancel")
    @transaction.atomic
    def cancel(self, request, pk=None):
        order = Order.objects.filter(id=pk, user=request.user).first()
        if not order:
            return Response(
                {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "Only pending orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            details = OrderDetail.objects.filter(
                order=order
            ).select_related("product_variant")

            for detail in details:
                variant = detail.product_variant
                variant.stock += detail.quantity
                variant.save(update_fields=["stock"])

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        return Response(
            serializers.OrderSerializer(order).data, status=status.HTTP_200_OK
        )


class CreateOrderFromCartItemView(generics.CreateAPIView):
    permission_classes = [perms.IsCustomer]
    serializer_class = serializers.CreateOrderFromCartItemSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cart_item_id = kwargs.get("cart_item_id")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipping_address = serializer.validated_data["shipping_address"]
        payment_method = serializer.validated_data["payment_method"]

        try:
            cart_item = CartItem.objects.select_related(
                "product_variant", "product_variant__product"
            ).get(id=cart_item_id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            order = services.create_order(
                user=request.user,
                variant=cart_item.product_variant,
                quantity=cart_item.quantity,
                shipping_address=shipping_address,
                payment_method=payment_method,
            )
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item.delete()

        return Response(
            {
                "message": "Order created successfully.",
                "order_id": order.id,
                "total_amount": total_amount,
                "status": order.status,
            },
            status=status.HTTP_201_CREATED,
        )

class StaffOrderViewSet(viewsets.ViewSet):
    permission_classes = [perms.IsStaff]

    def list(self, request):
        orders = Order.objects.all().order_by("-created_date")
        order_status = request.query_params.get("status")

        if order_status:
            if order_status not in Order.Status.values:
                return Response(
                    {"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST
                )

            orders = orders.filter(status=order_status)

        return Response(
            serializers.OrderSerializer(orders, many=True).data, status=status.HTTP_200_OK
        )

    def retrieve(self, request, pk=None):
        order = Order.objects.filter(id=pk).first()
        if not order:
            return Response(
                {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(serializers.OrderSerializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="confirm")
    def confirm(self, request, pk=None):
        order = Order.objects.filter(id=pk).first()
        if not order:
            return Response(
                {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "Only PENDING orders can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])

        return Response(serializers.OrderSerializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = Order.objects.filter(id=pk).first()
        if not order:
            return Response(
                {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if order.status == Order.Status.CANCELLED:
            return Response(
                {"detail": "Cancelled order cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")

        if new_status not in Order.Status.values:
            return Response(
                {"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST
            )

        allowed_transitions = {
            Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.CANCELLED],
            Order.Status.CONFIRMED: [Order.Status.SHIPPED, Order.Status.CANCELLED],
            Order.Status.SHIPPED: [Order.Status.COMPLETED],
            Order.Status.COMPLETED: [],
            Order.Status.CANCELLED: [],
        }

        if new_status not in allowed_transitions[order.status]:
            return Response(
                {
                    "detail": (
                        f"Cannot change status from " f"{order.status} to {new_status}."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        order.status = new_status
        order.save(update_fields=["status"])

        return Response(serializers.OrderSerializer(order).data, status=status.HTTP_200_OK)


class AdminDashboardViewSet(viewsets.ViewSet):

    permission_classes = [perms.Isadmin]

    def filter_orders_by_date(self, orders, data):
        date_from = data.get("date_from")
        date_to = data.get("date_to")
        if date_from:
            orders = orders.filter(created_date__date__gte=date_from)
        if date_to:
            orders = orders.filter(created_date__date__lte=date_to)

        return orders

    def valid_orders(self):
        return Order.objects.exclude(status=Order.Status.CANCELLED)

    @action(methods=["get"], detail=False, url_path="revenue")
    def revenue(self, request):

        serializer = serializers.DashboardRevenueSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        period = data["period"]
        orders = self.filter_orders_by_date(self.valid_orders(), data)
        orders = orders.filter(payment__status="SUCCESS")
        if period == "month":
            data = (
                orders.annotate(period_date=TruncMonth("created_date"))
                .values("period_date")
                .annotate(revenue=Sum("total_amount"))
                .order_by("period_date")
            )
            result = [
                {
                    "period": item["period_date"].strftime("%Y-%m"),
                    "revenue": item["revenue"],
                }
                for item in data
            ]
        elif period == "quarter":
            data = (
                orders.annotate(period_date=TruncQuarter("created_date"))
                .values("period_date")
                .annotate(revenue=Sum("total_amount"))
                .order_by("period_date")
            )
            result = [
                {
                    "period": (
                        f"{item['period_date'].year}-Q"
                        f"{((item['period_date'].month - 1) // 3) + 1}"
                    ),
                    "revenue": item["revenue"],
                }
                for item in data
            ]
        else:

            data = (
                orders.annotate(period_date=TruncYear("created_date"))
                .values("period_date")
                .annotate(revenue=Sum("total_amount"))
                .order_by("period_date")
            )
            result = [
                {
                    "period": item["period_date"].strftime("%Y"),
                    "revenue": item["revenue"],
                }
                for item in data
            ]

        return Response({"period": period, "data": result}, status=status.HTTP_200_OK)

    @action(methods=["get"], detail=False, url_path="orders")
    def orders(self, request):

        serializer = serializers.DashboardDateSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        orders = self.filter_orders_by_date(self.valid_orders(), data)
        result = orders.values("status").annotate(count=Count("id")).order_by("status")
        orders_by_status = {item["status"]: item["count"] for item in result}

        return Response(
            {"total_orders": orders.count(), "orders_by_status": orders_by_status},
            status=status.HTTP_200_OK,
        )

    @action(methods=["get"], detail=False, url_path="top-products")
    def top_products(self, request):

        serializer = serializers.DashboardTopProductSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        limit = data["limit"]
        orders = self.filter_orders_by_date(self.valid_orders(), data)
        orders = orders.filter(payment__status="SUCCESS")
        details = OrderDetail.objects.filter(order__in=orders)

        products = (
            details.values("product_variant__product_id", "product_variant__product__name")
            .annotate(
                quantity_sold=Sum("quantity"),
                revenue=Sum(F("quantity") * F("unit_price")),
            )
            .order_by("-quantity_sold")[:limit]
        )

        result = [
            {
                "product_id": item["product_variant__product_id"],
                "product_name": item["product_variant__product__name"],
                "quantity_sold": item["quantity_sold"],
                "revenue": item["revenue"],
            }
            for item in products
        ]

        return Response({"limit": limit, "products": result}, status=status.HTTP_200_OK)

class VNPayCreatePaymentView(APIView):
    permission_classes = [perms.IsCustomer]

    def post(self, request):
        order_id = request.data.get("order_id")

        if not order_id:
            return Response({"detail": "order_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response( {"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status == Order.Status.CANCELLED:
            return Response({"detail": "Cancelled order cannot be paid."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = order.payment
        except Payment.DoesNotExist:
            payment = None

        if payment and payment.status == Payment.Status.PAID:
            return Response({"detail": "Order has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        # Nếu chưa có Payment thì tạo
        if payment is None:
            payment = Payment.objects.create(
                order=order,
                method=Payment.Method.VNpay,
                amount=order.total_amount,
                status=Payment.Status.PENDING
            )

        else:
            payment.amount = order.total_amount
            payment.method = Payment.Method.VNpay
            payment.status = Payment.Status.PENDING
            payment.save(update_fields=["amount", "method", "status" ])

        ip_address = request.META.get(
            "HTTP_X_FORWARDED_FOR"
        )

        if ip_address:
            ip_address = ip_address.split(",")[0]
        else:
            ip_address = request.META.get(
                "REMOTE_ADDR",
                "127.0.0.1"
            )

        payment_url = build_vnpay_payment_url(
            order=order,
            ip_address=ip_address
        )

        return Response(
            {
                "message": "Create VNPay payment successfully.",
                "order_id": order.id,
                "payment_id": payment.id,
                "amount": str(payment.amount),
                "payment_url": payment_url
            },
            status=status.HTTP_200_OK
        )

class VNPayCallbackView(APIView):

    def get(self, request):
        params = request.GET.dict()

        if not verify_vnpay_signature(params):
            return Response(
                {
                    "success": False,
                    "message": "Invalid VNPay signature."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        txn_ref = params.get("vnp_TxnRef")
        response_code = params.get("vnp_ResponseCode")
        transaction_status = params.get(
            "vnp_TransactionStatus"
        )

        if not txn_ref:
            return Response(
                {
                    "success": False,
                    "message": "Missing vnp_TxnRef."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.get(id=int(txn_ref))
        except (Order.DoesNotExist, ValueError):
            return Response(
                {
                    "success": False,
                    "message": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            payment = order.payment
        except Payment.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        vnp_amount = params.get("vnp_Amount")
        if not vnp_amount:
            return Response(
                {
                    "success": False,
                    "message": "Missing payment amount."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            expected_amount = int(
                payment.amount * 100
            )
            received_amount = int(vnp_amount)

        except (ValueError, TypeError):
            return Response(
                {
                    "success": False,
                    "message": "Invalid payment amount."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if received_amount != expected_amount:
            return Response(
                {
                    "success": False,
                    "message": "Payment amount mismatch."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            response_code == "00"
            and transaction_status == "00"
        ):
            if payment.status != Payment.Status.PAID:

                payment.status = Payment.Status.PAID
                payment.save(
                    update_fields=["status"]
                )
            return Response(
                {
                    "success": True,
                    "message": "Payment successful.",
                    "order_id": order.id,
                    "payment_id": payment.id,
                    "payment_status": payment.status
                },
                status=status.HTTP_200_OK
            )
        payment.status = Payment.Status.FAILED
        payment.save(
            update_fields=["status"]
        )
        return Response(
            {
                "success": False,
                "message": "Payment failed.",
                "order_id": order.id,
                "payment_id": payment.id,
                "payment_status": payment.status,
                "response_code": response_code
            },
            status=status.HTTP_200_OK
        )
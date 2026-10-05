from rest_framework import serializers
from FashionStore.models import (
    User,
    TokenBlacklist,
    Category,
    Product,
    ProductVariant,
    Cart,
    CartItem,
    Rating,
    Order,
    OrderDetail,
    Payment,
    Discount
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import password_validation
from datetime import datetime, timezone


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "password",
            "is_active",
            "last_login",
            "is_approved"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.role = User.Role.CUSTOMER
        Cart.objects.create(user=user)
        user.is_active = True
        user.is_approved = False
        user.save(update_fields=["role", "is_active", "is_approved"])
        return user


class LoginSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)


    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.role == user.Role.STAFF and not user.is_approved:
            raise serializers.ValidationError(
                {"detail": "Your account is not approved."}
            )
        data["user"] = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "avatar": str(user.avatar.url)
        }
        return data


class LogoutSerializer(serializers.Serializer):
    access = serializers.CharField()

    def validate(self, attrs):
        try:
            token = AccessToken(attrs["access"])
            jti = token["jti"]
            user_id = token["user_id"]
            exp = token["exp"]
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            TokenBlacklist.objects.get_or_create(
                jti=jti,
                defaults={
                    "user_id": user_id,
                    "expires_at": expires_at,
                },
            )
        except Exception as e:
            print("LOGOUT ERROR:", repr(e))
            raise serializers.ValidationError({"access": "Invalid access token."})

        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "avatar"]
        read_only_fields = ["id"]

    def validate_avatar(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Avatar size must not exceed 5MB.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(write_only=True, required=True)
    newPassword = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        user = self.context["request"].user
        old_password = attrs["oldPassword"]
        new_password = attrs["newPassword"]

        if not old_password.strip():
            raise serializers.ValidationError(
                {"oldPassword": "Old password cannot be empty."}
            )
        if not new_password.strip():
            raise serializers.ValidationError(
                {"newPassword": "New password cannot be empty."}
            )
        if not user.check_password(old_password):
            raise serializers.ValidationError(
                {"oldPassword": "Old password is incorrect."}
            )
        if old_password == new_password:
            raise serializers.ValidationError(
                {"newPassword": "New password must different from old password."}
            )
        password_validation.validate_password(new_password, user)

        return attrs


class UserActiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_active"]

    def validate(self, attrs):
        request = self.context["request"]
        if self.instance == request.user:
            raise serializers.ValidationError("You cannot deactivate your own account.")

        return attrs


class StaffSerializer(UserSerializer):
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.role = User.Role.STAFF
        user.is_approved = True
        user.save()
        return user


class CategorySerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent",
        queryset=Category.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Category
        fields = ["id", "name", "is_active", "parent_id"]


class CategoryDetailSerializer(CategorySerializer):
    class Meta:
        model = CategorySerializer.Meta.model
        fields = CategorySerializer.Meta.fields + ["created_date", "updated_date"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "description",
            "thumbnail",
            "price",
            "average_rating",
            "quantity_sold",
        ]

class VariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "image", "size", "color", "price", "stock", "min_stock"]


class CartItemSerializer(serializers.ModelSerializer):
    thumbnail = serializers.CharField(source="product_variant.product.thumbnail.url", read_only=True)
    product_name = serializers.CharField(source="product_variant.product.name", read_only=True)
    product_id = serializers.IntegerField(source="product_variant.product.id",read_only=True)
    color = serializers.CharField(source="product_variant.color", read_only=True)
    size = serializers.CharField(source="product_variant.size", read_only=True)
    price = serializers.DecimalField(source="product_variant.price", max_digits=12, decimal_places=2, read_only=True)
    stock = serializers.IntegerField(source="product_variant.stock", read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "quantity", "created_date", "product_variant", "product_name", "product_id", "color", "size", "price", "thumbnail", "stock"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(source="cartitem_set", many=True)

    class Meta:
        model = Cart
        fields = ["id", "items"]


class RatingSerializer(serializers.ModelSerializer):
    customer_username = serializers.SerializerMethodField()
    customer_avatar = serializers.SerializerMethodField()
    class Meta:
        model = Rating
        fields = ["id", "rate", "comment", "created_date", "updated_date", "product", "user_id", "customer_username", "customer_avatar"]
    
    def get_customer_username(self, obj):
        return obj.user.username

    def get_customer_avatar(self, obj):
        if obj.user.avatar:
            return str(obj.user.avatar)
        return None

class OrderSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    cart_item_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), write_only=True, required=True, allow_empty=False)
    shipping_address = serializers.CharField(required=True, allow_blank=False)
    phone = serializers.CharField(required=True,allow_blank=False,max_length=20)
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices, write_only=True)
    payment_method_display = serializers.CharField(source="payment.method", read_only=True)
    payment_status = serializers.CharField(source="payment.status", read_only=True)
    class Meta:
        model = Order
        fields = ["id", "shipping_address", "payment_method", "payment_status", "payment_method_display", "total_amount", "status", "created_date", "phone", "cart_item_ids", "username"]
        read_only_fields = ["id", "total_amount", "status", "created_date"]

class OrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product_variant.product.name", read_only=True)
    image = serializers.CharField(source="product_variant.image.url", read_only=True)
    size = serializers.CharField(source="product_variant.size", read_only=True)
    color = serializers.CharField(source="product_variant.color", read_only=True)

    class Meta:
        model = OrderDetail
        fields = [
            "id",
            "product_name",
            "image",
            "size",
            "color",
            "unit_price",
            "quantity",
        ]


class CreateOrderFromCartItemSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(
        max_length=500,
        allow_blank=False
    )
    phone = serializers.CharField(
        max_length=20,
        allow_blank=False
    )
    payment_method = serializers.ChoiceField(
        choices=Payment.Method.choices
    )
    quantity = serializers.IntegerField(min_value=1)

    def validate_shipping_address(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Shipping address is required."
            )
        return value.strip()

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ["id", "code", "value", "min_order_value", "max_discount", "usage_limit", "used_count", "start_date", "end_date", "is_active"]
        read_only_fields = ["id", "used_count"]

    def validate(self, data):
        value = data.get("value", getattr(self.instance, "value", None))
        min_order_value = data.get("min_order_value", getattr(self.instance, "min_order_value", 0))
        max_discount = data.get("max_discount", getattr(self.instance, "max_discount", None))
        usage_limit = data.get("usage_limit", getattr(self.instance, "usage_limit", None))
        start_date = data.get("start_date", getattr(self.instance, "start_date", None))
        end_date = data.get("end_date", getattr(self.instance, "end_date", None))

        if value <= 0 or value > 100:
            raise serializers.ValidationError({"value": "Discount percentage must be between 0 and 100."})
        if min_order_value < 0:
            raise serializers.ValidationError({"min_order_value": "Minimum order value cannot be negative."})
        if max_discount is not None and max_discount <= 0:
            raise serializers.ValidationError({"max_discount": "Maximum discount must be greater than 0."})
        if usage_limit is not None and usage_limit <= 0:
            raise serializers.ValidationError({"usage_limit": "Usage limit must be greater than 0."})
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        return data

class AvailableDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ["id", "code", "value", "min_order_value", "max_discount", "start_date", "end_date"]

class SelectDiscountSerializer(serializers.Serializer):
    discount_id = serializers.CharField()

class DashboardDateSerializer(serializers.Serializer):
    date_from = serializers.DateField(
        required=False,
        allow_null=True
    )
    date_to = serializers.DateField(
        required=False,
        allow_null=True
    )

    def validate(self, attrs):
        date_from = attrs.get("date_from")
        date_to = attrs.get("date_to")

        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError(
                "date_from must be less than or equal to date_to."
            )

        return attrs


class DashboardRevenueSerializer(DashboardDateSerializer):
    period = serializers.ChoiceField(
        choices=["month", "quarter", "year"],
        default="month"
    )


class DashboardTopProductSerializer(DashboardDateSerializer):
    limit = serializers.IntegerField(
        min_value=1,
        max_value=100,
        default=10
    )
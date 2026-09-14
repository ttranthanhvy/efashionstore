from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
import random
import string


# Create your models here.
class User(AbstractUser):
    avatar = CloudinaryField("avatar", default="default_avatar")
    email = models.EmailField(unique=True)
    
    is_approved = models.BooleanField(default=False)

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        STAFF = "STAFF", "Sales Staff"
        CUSTOMER = "CUSTOMER", "Customer"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)


class BaseModel(models.Model):
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(BaseModel):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["parent", "name"], name="unique_category_name_in_parent")]

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True)
    thumbnail = CloudinaryField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    quantity_sold = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    category = models.ForeignKey(Category, on_delete=models.PROTECT)


class ProductVariant(models.Model):
    image = CloudinaryField()
    size = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    color = models.CharField(max_length=20, blank=True, null=True)
    min_stock = models.IntegerField()
    stock = models.IntegerField()
    is_active = models.BooleanField(default=True)

    product = models.ForeignKey(Product, on_delete=models.CASCADE)

def generate_discount_id():
    return "DIS" + "".join(random.choices(string.ascii_uppercase + string.digits, k=9))

class Discount(models.Model):
    id = models.CharField(max_length=12, primary_key=True, editable=False, default=generate_discount_id)
    code = models.CharField(max_length=50, unique=True)
    value = models.DecimalField(max_digits=5, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

def generate_order_code():
    return "ORD" + "".join(random.choices(string.ascii_uppercase + string.digits, k=9))
class Order(models.Model):
    id = models.CharField(max_length=12, primary_key=True, editable=False, default=generate_order_code)
    shipping_address = models.CharField(max_length=500)
    phone = models.CharField(max_length=20)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_date = models.DateTimeField(auto_now_add=True)
    discount = models.ForeignKey("Discount", on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        SHIPPED = "SHIPPED", "Shipped"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    user = models.ForeignKey(User, on_delete=models.CASCADE)


class OrderDetail(models.Model):
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])

    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)


class CartItem(models.Model):
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    created_date = models.DateTimeField(auto_now_add=True)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["cart", "product_variant"], name="unique_cart_product")]


class Payment(models.Model):

    class Method(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        VNpay = "vnpay", "VNpay"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    method = models.CharField(max_length=20, choices=Method.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    created_date = models.DateTimeField(auto_now_add=True)

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="payment"
    )

class Rating(BaseModel):
    rate = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(max_length=500, null=True, blank=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"], name="unique_user_rating"
            )
        ]


class TokenBlacklist(models.Model):
    jti = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.jti


from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import Cart, Order, OrderDetail, Payment, CartItem, Discount

def calculate_discount(discount_id, total_amount):
    if not discount_id:
        return None, Decimal("0")
    try:
        discount = Discount.objects.get(id=discount_id)
    except Discount.DoesNotExist:
        raise ValueError("Discount does not exist.")
    now = timezone.now()
    if not discount.is_active:
        raise ValueError("Discount is no longer active.")
    if now < discount.start_date:
        raise ValueError("Discount has not started yet.")
    if now > discount.end_date:
        raise ValueError("Discount has expired.")
    if discount.usage_limit is not None and discount.used_count >= discount.usage_limit:
        raise ValueError("Discount has reached its usage limit.")
    if total_amount < discount.min_order_value:
        raise ValueError(f"Minimum order value is {discount.min_order_value:,.0f} VND.")
    discount_amount = total_amount * discount.value / Decimal("100")
    if discount.max_discount is not None:
        discount_amount = min(discount_amount, discount.max_discount)
    discount_amount = min(discount_amount, total_amount)
    return discount, discount_amount

@transaction.atomic
def create_order_from_selected_cart_items(user, cart_item_ids, shipping_address, phone, payment_method, discount_id=None):
    try:
        cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
        raise ValueError("Cart does not exist.")
    cart_items = list(CartItem.objects.select_related("product_variant", "product_variant__product").filter(cart=cart, id__in=cart_item_ids))
    if not cart_items:
        raise ValueError("No cart items selected.")
    selected_ids = set(cart_item_ids)
    found_ids = {item.id for item in cart_items}
    if selected_ids != found_ids:
        raise ValueError("Some selected cart items do not belong to your cart.")
    total_amount = Decimal("0")
    for cart_item in cart_items:
        variant = cart_item.product_variant
        product = variant.product
        if not product.is_active:
            raise ValueError(f"Product '{product.name}' is inactive.")
        if not variant.is_active:
            raise ValueError(f"Product variant of '{product.name}' is inactive.")
        if cart_item.quantity < 1:
            raise ValueError(f"Invalid quantity for '{product.name}'.")
        if variant.stock < cart_item.quantity:
            raise ValueError(f"Not enough stock for '{product.name}'.")
        total_amount += variant.price * cart_item.quantity
    discount, discount_amount = calculate_discount(discount_id, total_amount)
    final_amount = total_amount - discount_amount
    order = Order.objects.create(user=user, shipping_address=shipping_address, phone=phone, total_amount=final_amount, discount=discount, discount_amount=discount_amount, status=Order.Status.PENDING)
    for cart_item in cart_items:
        variant = cart_item.product_variant
        OrderDetail.objects.create(order=order, product_variant=variant, quantity=cart_item.quantity, unit_price=variant.price)
        variant.stock -= cart_item.quantity
        variant.save(update_fields=["stock"])
    Payment.objects.create(order=order, method=payment_method, amount=final_amount, status=Payment.Status.PENDING)
    if discount:
        discount.used_count += 1
        discount.save(update_fields=["used_count"])
    CartItem.objects.filter(cart=cart, id__in=cart_item_ids).delete()
    return order

@transaction.atomic
def create_order(user, variant, quantity, shipping_address, phone, payment_method, discount_id=None):
    if not variant.product.is_active:
        raise ValueError("Product is inactive.")
    if not variant.is_active:
        raise ValueError("Product variant is inactive.")
    if quantity < 1:
        raise ValueError("Invalid quantity.")
    if variant.stock < quantity:
        raise ValueError("Not enough stock.")
    total_amount = variant.price * quantity
    discount, discount_amount = calculate_discount(discount_id, total_amount)
    final_amount = total_amount - discount_amount
    order = Order.objects.create(user=user, shipping_address=shipping_address, phone=phone, total_amount=final_amount, discount=discount, discount_amount=discount_amount, status=Order.Status.PENDING)
    OrderDetail.objects.create(order=order, product_variant=variant, quantity=quantity, unit_price=variant.price)
    variant.stock -= quantity
    variant.save(update_fields=["stock"])
    Payment.objects.create(order=order, method=payment_method, amount=final_amount, status=Payment.Status.PENDING)
    if discount:
        discount.used_count += 1
        discount.save(update_fields=["used_count"])
    return order
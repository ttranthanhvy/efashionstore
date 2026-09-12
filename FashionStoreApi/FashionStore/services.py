from django.db import transaction

from .models import Cart, Order, OrderDetail, Payment, CartItem


@transaction.atomic
def create_order_from_selected_cart_items(
    user,
    cart_item_ids,
    shipping_address,
    phone,
    payment_method,
):
    try:
        cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
        raise ValueError("Cart does not exist.")

    cart_items = list(
        CartItem.objects.select_related(
            "product_variant", "product_variant__product"
        ).filter(cart=cart, id__in=cart_item_ids)
    )

    if not cart_items:
        raise ValueError("No cart items selected.")

    selected_ids = set(cart_item_ids)
    found_ids = {item.id for item in cart_items}

    if selected_ids != found_ids:
        raise ValueError("Some selected cart items do not belong to your cart.")

    total_amount = 0

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

    order = Order.objects.create(
        user=user,
        shipping_address=shipping_address,
        phone=phone,
        total_amount=total_amount,
        status=Order.Status.PENDING,
    )

    for cart_item in cart_items:
        variant = cart_item.product_variant

        OrderDetail.objects.create(
            order=order,
            product_variant=variant,
            quantity=cart_item.quantity,
            unit_price=variant.price,
        )

        variant.stock -= cart_item.quantity
        variant.save(update_fields=["stock"])

    Payment.objects.create(
        order=order,
        method=payment_method,
        amount=total_amount,
        status=Payment.Status.PENDING,
    )

    CartItem.objects.filter(cart=cart, id__in=cart_item_ids).delete()

    return order


@transaction.atomic
def create_order(
    user,
    variant,
    quantity,
    shipping_address,
    phone,
    payment_method,
):
    if not variant.product.is_active:
        raise ValueError("Product is inactive.")

    if not variant.is_active:
        raise ValueError("Product variant is inactive.")

    if quantity < 1:
        raise ValueError("Invalid quantity.")

    if variant.stock < quantity:
        raise ValueError("Not enough stock.")

    total_amount = variant.price * quantity

    order = Order.objects.create(
        user=user,
        shipping_address=shipping_address,
        phone=phone,
        total_amount=total_amount,
        status=Order.Status.PENDING,
    )

    OrderDetail.objects.create(
        order=order,
        product_variant=variant,
        quantity=quantity,
        unit_price=variant.price,
    )

    variant.stock -= quantity
    variant.save(update_fields=["stock"])

    Payment.objects.create(
        order=order,
        method=payment_method,
        amount=total_amount,
        status=Payment.Status.PENDING,
    )

    return order

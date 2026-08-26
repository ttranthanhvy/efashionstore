from .models import Order, OrderDetail, Payment, OrderHistory


def create_order(
    user,
    variant,
    quantity,
    shipping_address,
    payment_method,
):
    product = variant.product

    if not product.is_active:
        raise ValueError(f"Product '{product.name}' is inactive.")

    if not variant.is_active:
        raise ValueError("Product variant is inactive.")

    if variant.stock < quantity:
        raise ValueError(f"Not enough stock for '{product.name}'.")

    unit_price = variant.price
    total_amount = unit_price * quantity

    order = Order.objects.create(
        user=user,
        shipping_address=shipping_address,
        total_amount=total_amount,
        status=Order.Status.PENDING,
    )

    OrderDetail.objects.create(
        order=order,
        product_variant=variant,
        quantity=quantity,
        unit_price=unit_price,
    )

    Payment.objects.create(
        order=order,
        method=payment_method,
        amount=total_amount,
        status=Payment.Status.PENDING,
    )

    variant.stock -= quantity
    variant.save(update_fields=["stock"])

    return order

import hashlib
import hmac
import urllib.parse
from django.conf import settings
from datetime import datetime

def build_vnpay_payment_url(order, ip_address):
    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Amount": int(order.total_amount * 100),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": str(order.id),
        "vnp_OrderInfo": f"Payment {order.id}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_BankCode": "VNBANK",
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": ip_address,
    }

    params["vnp_CreateDate"] = datetime.now().strftime("%Y%m%d%H%M%S")

    # Sort theo tên parameter
    sorted_params = sorted(params.items())

    query_string = urllib.parse.urlencode(
        sorted_params, quote_via=urllib.parse.quote_plus
    )

    secure_hash = hmac.new(
        settings.VNPAY_HASH_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()

    payment_url = (
        f"{settings.VNPAY_PAYMENT_URL}"
        f"?{query_string}"
        f"&vnp_SecureHash={secure_hash}"
    )

    return payment_url


def verify_vnpay_signature(params):
    received_hash = params.get("vnp_SecureHash")

    if not received_hash:
        return False

    params = dict(params)
    params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)
    sorted_params = sorted(params.items())
    query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote_plus)

    calculated_hash = hmac.new(
        settings.VNPAY_HASH_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(calculated_hash.lower(), received_hash.lower())

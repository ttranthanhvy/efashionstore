import { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state;
    const [shippingAddress, setShippingAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    if (!state) return <Container className="py-5"><Alert variant="danger">Không có thông tin thanh toán.</Alert><Button variant="secondary" onClick={() => navigate("/")}>Về trang chủ</Button></Container>;

    const isCart = state.type === "cart";
    const isProduct = state.type === "product";
    const cartItemIds = state.cartItemIds || [];
    const selectedItems = state.selectedItems || [];
    const product = state.product;
    const variant = state.variant;
    const quantity = Number(state.quantity || 1);

    const totalQuantity = isCart ? selectedItems.reduce((total, item) => total + Number(item.quantity || 0), 0) : quantity;
    const totalPrice = isCart ? selectedItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0) : Number(variant?.price || product?.price || 0) * quantity;
    const formatPrice = price => Number(price || 0).toLocaleString("vi-VN") + " ₫";

    const createOrder = async () => {
        setErrorMessage("");
        if (!shippingAddress.trim()) {
            setErrorMessage("Vui lòng nhập địa chỉ giao hàng.");
            return;
        }
        if (!phone.trim()) {
            setErrorMessage("Vui lòng nhập số điện thoại.");
            return;
        }
        if (!/^[0-9]{9,11}$/.test(phone.trim())) {
            setErrorMessage("Số điện thoại không hợp lệ.");
            return;
        }

        try {
            setCheckoutLoading(true);
            let order;

            if (isCart) {
                if (cartItemIds.length === 0) {
                    setErrorMessage("Vui lòng chọn ít nhất một sản phẩm.");
                    return;
                }
                const res = await Apis.post(endpoints.orders, { cart_item_ids: cartItemIds, shipping_address: shippingAddress.trim(), phone: phone.trim(), payment_method: paymentMethod });
                order = res.data;
            }

            if (isProduct) {
                if (!state.productId || !state.variantId) {
                    setErrorMessage("Thông tin sản phẩm không hợp lệ.");
                    return;
                }
                const res = await Apis.post(endpoints["variant-orders"](state.variantId), { quantity, shipping_address: shippingAddress.trim(), phone: phone.trim(), payment_method: paymentMethod });
                order = res.data;
            }

            if (!order) {
                setErrorMessage("Không thể tạo đơn hàng.");
                return;
            }

            const orderId = order.id || order.order_id;

            if (paymentMethod === "vnpay") {
                const paymentRes = await Apis.post(endpoints.vnpay, { order_id: orderId });
                if (!paymentRes.data?.payment_url) {
                    setErrorMessage("Không nhận được đường dẫn thanh toán VNPAY.");
                    return;
                }
                window.location.href = paymentRes.data.payment_url;
                return;
            }

            navigate("/orders");
        } catch (error) {
            console.error("CREATE ORDER ERROR:", error.response?.data);
            const data = error.response?.data;
            if (data?.detail) setErrorMessage(data.detail);
            else if (data?.cart_item_ids) setErrorMessage(Array.isArray(data.cart_item_ids) ? data.cart_item_ids.join(" ") : data.cart_item_ids);
            else if (data?.payment_method) setErrorMessage(Array.isArray(data.payment_method) ? data.payment_method.join(" ") : data.payment_method);
            else if (data?.shipping_address) setErrorMessage(Array.isArray(data.shipping_address) ? data.shipping_address.join(" ") : data.shipping_address);
            else if (data?.phone) setErrorMessage(Array.isArray(data.phone) ? data.phone.join(" ") : data.phone);
            else setErrorMessage("Không thể tạo đơn hàng.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <h3 className="fw-bold mb-4">Thanh toán</h3>
            <Row>
                <Col md={7}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-4">Thông tin giao hàng</h5>
                            {errorMessage && <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}
                            <Form.Group className="mb-3">
                                <Form.Label>Địa chỉ giao hàng</Form.Label>
                                <Form.Control as="textarea" rows={3} value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Nhập địa chỉ nhận hàng" />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
                            </Form.Group>
                            <h5 className="fw-bold mb-3">Phương thức thanh toán</h5>
                            <Form.Check type="radio" name="paymentMethod" label="Thanh toán khi nhận hàng (COD)" value="cod" checked={paymentMethod === "cod"} onChange={e => setPaymentMethod(e.target.value)} className="mb-3" />
                            <Form.Check type="radio" name="paymentMethod" label="Thanh toán qua VNPAY" value="vnpay" checked={paymentMethod === "vnpay"} onChange={e => setPaymentMethod(e.target.value)} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={5}>
                    <Card className="border-0 shadow-sm" style={{ position: "sticky", top: "20px" }}>
                        <Card.Body>
                            <h5 className="fw-bold mb-4">Đơn hàng</h5>
                            {isCart && selectedItems.map(item => (
                                <div key={item.id} className="d-flex justify-content-between mb-3">
                                    <div>
                                        <div className="fw-semibold">{item.product_name || `Sản phẩm #${item.product_variant}`}</div>
                                        <small className="text-muted">{item.color || ""}{item.color && item.size && " / "}{item.size || ""} × {item.quantity}</small>
                                    </div>
                                    <strong>{formatPrice(Number(item.price) * Number(item.quantity))}</strong>
                                </div>
                            ))}
                            {isProduct && <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <div className="fw-semibold">{product?.name}</div>
                                    <small className="text-muted">{variant?.color || ""}{variant?.color && variant?.size && " / "}{variant?.size || ""} × {quantity}</small>
                                </div>
                                <strong>{formatPrice(Number(variant?.price || product?.price || 0) * quantity)}</strong>
                            </div>}
                            <hr />
                            <div className="d-flex justify-content-between mb-3"><span>Số lượng</span><strong>{totalQuantity}</strong></div>
                            <div className="d-flex justify-content-between align-items-center mb-4"><span className="fw-bold">Tổng tiền</span><h4 className="text-danger fw-bold mb-0">{formatPrice(totalPrice)}</h4></div>
                            <Button variant="danger" size="lg" className="w-100" onClick={createOrder} disabled={checkoutLoading}>{checkoutLoading ? <><Spinner animation="border" size="sm" className="me-2" />Đang xử lý...</> : "Đặt hàng"}</Button>
                            <Button variant="outline-secondary" className="w-100 mt-2" disabled={checkoutLoading} onClick={() => navigate(-1)}>Quay lại</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Checkout;
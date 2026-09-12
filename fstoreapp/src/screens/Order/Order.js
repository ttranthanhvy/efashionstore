import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Modal, Alert, Spinner, Nav } from "react-bootstrap";
import { FaEye, FaTimes, FaCreditCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";

const Order = () => {
    const nav = useNavigate();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await Apis.get(endpoints.orders);
            setOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể tải danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const viewDetail = async order => {
        try {
            setSelectedOrder(order);
            setShowDetail(true);
            setLoadingDetail(true);
            const res = await Apis.get(endpoints["order-details"](order.id));
            setDetails(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể tải chi tiết đơn hàng.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const cancelOrder = async orderId => {
        if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
        try {
            await Apis.patch(`${endpoints.orders}${orderId}/cancel/`);
            setSuccessMessage("Đã hủy đơn hàng.");
            await loadOrders();
            if (selectedOrder?.id === orderId) setShowDetail(false);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể hủy đơn hàng.");
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const payVNPay = async orderId => {
        try {
            const res = await Apis.post(endpoints.vnpay, { order_id: orderId });
            if (res.data.payment_url) window.location.href = res.data.payment_url;
            else throw new Error();
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể tạo thanh toán VNPAY.");
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const getStatus = status => {
        const statuses = {
            PENDING: { text: "Chờ xác nhận", variant: "warning" },
            CONFIRMED: { text: "Chờ giao hàng", variant: "primary" },
            SHIPPED: { text: "Đang giao", variant: "info" },
            COMPLETED: { text: "Hoàn thành", variant: "success" },
            CANCELLED: { text: "Đã hủy", variant: "danger" }
        };
        return statuses[status] || { text: status || "Không xác định", variant: "secondary" };
    };

    const formatPrice = price => Number(price || 0).toLocaleString("vi-VN") + " ₫";

    const filterOrders = () => {
        switch (activeTab) {
            case "TO_PAY":
                return orders.filter(o => o.payment_method?.toLowerCase() === "vnpay" && o.payment_status?.toLowerCase() !== "paid" && o.status !== "CANCELLED");
            case "TO_CONFIRM":
                return orders.filter(o => o.status === "PENDING");
            case "TO_SHIP":
                return orders.filter(o => o.status === "CONFIRMED");
            case "TO_RECEIVE":
                return orders.filter(o => o.status === "SHIPPED");
            case "COMPLETED":
                return orders.filter(o => o.status === "COMPLETED");
            case "CANCELLED":
                return orders.filter(o => o.status === "CANCELLED");
            default:
                return orders;
        }
    };

    const tabs = [
        ["ALL", "Tất cả"],
        ["TO_PAY", "Chờ thanh toán"],
        ["TO_CONFIRM", "Chờ xác nhận"],
        ["TO_SHIP", "Chờ giao hàng"],
        ["TO_RECEIVE", "Đang giao"],
        ["COMPLETED", "Hoàn thành"],
        ["CANCELLED", "Đã hủy"]
    ];

    const filteredOrders = filterOrders();

    return (
        <Container className="py-4">
            {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}
            <h3 className="fw-bold mb-4">Đơn hàng của tôi</h3>
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-0">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={key => setActiveTab(key)} className="order-tabs">
                        {tabs.map(([key, label]) => <Nav.Item key={key}><Nav.Link eventKey={key} className="px-3 py-3">{label}</Nav.Link></Nav.Item>)}
                    </Nav>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : filteredOrders.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: "60px" }}>📦</div>
                        <h5 className="fw-bold mt-3">Chưa có đơn hàng</h5>
                        <p className="text-muted">Không có đơn hàng trong mục này.</p>
                        <Button style={{ backgroundColor: "#F7C8D3", border: "none", color: "#2D3A47" }} onClick={() => nav("/home")}>Mua sắm ngay</Button>
                    </Card.Body>
                </Card>
            ) : (
                filteredOrders.map(order => {
                    const status = getStatus(order.status);
                    const isVNPay = order.payment_method?.toLowerCase() === "vnpay";
                    const isPaid = order.payment_status?.toLowerCase() === "paid";
                    return (
                        <Card key={order.id} className="mb-3 border-0 shadow-sm">
                            <Card.Body>
                                <Row className="align-items-center g-3">
                                    <Col md={2}><div className="text-muted small">Mã đơn</div><strong>#{order.id}</strong></Col>
                                    <Col md={2}><div className="text-muted small">Ngày đặt</div>{order.created_date ? new Date(order.created_date).toLocaleDateString("vi-VN") : "-"}</Col>
                                    <Col md={2}><div className="text-muted small">Tổng tiền</div><strong className="text-danger">{formatPrice(order.total_amount)}</strong></Col>
                                    <Col md={2}><div className="text-muted small">Thanh toán</div><div>{isVNPay ? "VNPay" : "Tiền mặt"}</div><small className={isPaid ? "text-success" : "text-danger"}>{isPaid ? "Đã thanh toán" : "Chưa thanh toán"}</small></Col>
                                    <Col md={2}><Badge bg={status.variant} className="px-3 py-2">{status.text}</Badge></Col>
                                    <Col md={2} className="text-md-end">
                                        <Button variant="outline-dark" size="sm" className="me-2" onClick={() => viewDetail(order)}><FaEye /></Button>
                                        {order.status === "PENDING" && <Button variant="outline-danger" size="sm" onClick={() => cancelOrder(order.id)}><FaTimes /></Button>}
                                        {isVNPay && !isPaid && order.status !== "CANCELLED" && <Button variant="dark" size="sm" className="ms-2" onClick={() => payVNPay(order.id)}><FaCreditCard /></Button>}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    );
                })
            )}

            <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Card className="border mb-4">
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}><div className="text-muted small">Địa chỉ giao hàng</div><strong>{selectedOrder.shipping_address || "Không có"}</strong></Col>
                                        <Col md={3}><div className="text-muted small">Số điện thoại</div><strong>{selectedOrder.phone || "Không có"}</strong></Col>
                                        <Col md={3}><div className="text-muted small">Trạng thái</div><Badge bg={getStatus(selectedOrder.status).variant}>{getStatus(selectedOrder.status).text}</Badge></Col>
                                    </Row>
                                    <hr />
                                    <Row>
                                        <Col md={6}><div className="text-muted small">Phương thức thanh toán</div><strong>{selectedOrder.payment_method?.toLowerCase() === "cod" ? "Thanh toán khi nhận hàng" : "VNPay"}</strong></Col>
                                        <Col md={6}><div className="text-muted small">Trạng thái thanh toán</div><strong className={selectedOrder.payment_status?.toLowerCase() === "paid" ? "text-success" : "text-danger"}>{selectedOrder.payment_status?.toLowerCase() === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</strong></Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {loadingDetail ? (
                                <div className="text-center py-4"><Spinner animation="border" /></div>
                            ) : details.length === 0 ? (
                                <div className="text-center text-muted py-4">Không có sản phẩm trong đơn hàng.</div>
                            ) : (
                                <>
                                    {details.map(detail => (
                                        <Card key={detail.id} className="mb-3 border">
                                            <Card.Body>
                                                <Row className="align-items-center">
                                                    <Col md={2}>
                                                        {detail.image ? <img src={detail.image.startsWith("http") ? detail.image : `https://res.cloudinary.com/kcord2gk/${detail.image}`} alt={detail.product_name || "Product"} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} /> : <div style={{ width: "80px", height: "80px", backgroundColor: "#eee", borderRadius: "8px" }} />}
                                                    </Col>
                                                    <Col md={4}>
                                                        <strong>{detail.product_name || "Sản phẩm"}</strong>
                                                        <div className="text-muted small">Màu: {detail.color || "Không có"}</div>
                                                        <div className="text-muted small">Size: {detail.size || "Không có"}</div>
                                                    </Col>
                                                    <Col md={2}>x{detail.quantity}</Col>
                                                    <Col md={4} className="text-end"><strong>{formatPrice(Number(detail.unit_price) * Number(detail.quantity))}</strong></Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                    <div className="text-end mt-4"><h5>Tổng tiền: <strong className="text-danger">{formatPrice(selectedOrder.total_amount)}</strong></h5></div>
                                    {selectedOrder.payment_method?.toLowerCase() === "vnpay" && selectedOrder.payment_status?.toLowerCase() !== "paid" && selectedOrder.status !== "CANCELLED" && <div className="text-end mt-3"><Button variant="dark" onClick={() => payVNPay(selectedOrder.id)}><FaCreditCard className="me-2" />Thanh toán VNPay</Button></div>}
                                </>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Order;
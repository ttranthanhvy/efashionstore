import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Modal, Row, Spinner } from "react-bootstrap";
import { FaEye, FaTimes } from "react-icons/fa";
import Apis, { endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Context";

const Order = () => {
    const [user] = useContext(MyUserContext);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showModal, setShowModal] = useState(false);

    const statusTabs = [
        { label: "Tất cả", value: "" },
        { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
        { label: "Chờ xác nhận", value: "PENDING" },
        { label: "Chờ giao hàng", value: "CONFIRMED" },
        { label: "Đang giao", value: "SHIPPED" },
        { label: "Hoàn thành", value: "COMPLETED" },
        { label: "Đã hủy", value: "CANCELLED" }
    ];

    const statusInfo = {
        PENDING: { text: "Chờ xác nhận", bg: "warning", color: "#856404" },
        CONFIRMED: { text: "Chờ giao hàng", bg: "info", color: "#0c5460" },
        SHIPPED: { text: "Đang giao", bg: "primary", color: "#004085" },
        COMPLETED: { text: "Hoàn thành", bg: "success", color: "#155724" },
        CANCELLED: { text: "Đã hủy", bg: "danger", color: "#721c24" }
    };

    const getImage = (image) => {
        if (!image) return "/images/no-image.png";
        if (image.startsWith("http")) return image;
        return `https://res.cloudinary.com/kcord2gk/${image}`;
    };

    const formatPrice = (price) => Number(price || 0).toLocaleString("vi-VN");

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const getStatus = (orderStatus) => statusInfo[orderStatus] || { text: orderStatus, bg: "secondary", color: "#383d41" };

    const loadOrders = async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            let url = endpoints.orders;
            if (status && status !== "PENDING_PAYMENT") url += `?status=${status}`;
            const res = await Apis.get(url);
            const orderList = Array.isArray(res.data) ? res.data : res.data.results || [];
            const ordersWithDetails = await Promise.all(orderList.map(async (order) => {
                try {
                    const detailRes = await Apis.get(endpoints["order-details"](order.id));
                    return { ...order, details: detailRes.data.details || [] };
                } catch {
                    return { ...order, details: [] };
                }
            }));
            setOrders(ordersWithDetails);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể tải danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadOrders();
    }, [user, status]);

    const viewDetail = async (order) => {
        try {
            setSelectedOrder(order);
            setDetails(order.details || []);
            setShowModal(true);
            setDetailLoading(true);
            const res = await Apis.get(endpoints["order-details"](order.id));
            setSelectedOrder(res.data);
            setDetails(res.data.details || []);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Không thể tải chi tiết đơn hàng.");
        } finally {
            setDetailLoading(false);
        }
    };

    const cancelOrder = async (order) => {
        if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
        try {
            await Apis.patch(`${endpoints["order-details"](order.id)}cancel/`);
            await loadOrders();
            if (selectedOrder?.id === order.id) {
                setShowModal(false);
                setSelectedOrder(null);
            }
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể hủy đơn hàng.");
        }
    };

    const payVNPay = async (order) => {
        try {
            const res = await Apis.post(endpoints.vnpay, { order_id: order.id });
            if (res.data?.payment_url) window.location.href = res.data.payment_url;
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể tạo thanh toán VNPay.");
        }
    };

    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Vui lòng đăng nhập để xem đơn mua.</Alert>
            </Container>
        );
    }

    return (
        <div style={{ background: "#fff7e8", minHeight: "100vh", paddingBottom: 50 }}>
            <Container fluid className="px-0" style={{ maxWidth: 1200 }}>
                <div style={{ padding: "0 10px" }}>
                    <h2 className="fw-bold mb-1">Đơn mua</h2>
                    <p className="text-muted mb-4">Theo dõi và quản lý các đơn hàng của bạn</p>
                </div>

                <div className="bg-white border-top border-bottom mb-4" style={{ overflowX: "auto" }}>
                    <div className="d-flex" style={{ minWidth: 750 }}>
                        {statusTabs.map((tab) => (
                            <button key={tab.value} onClick={() => setStatus(tab.value)} className="border-0 bg-white px-4 py-3" style={{ color: status === tab.value ? "#9b2c2c" : "#333", borderBottom: status === tab.value ? "2px solid #9b2c2c" : "2px solid transparent", whiteSpace: "nowrap" }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {errorMessage && (
                    <Container fluid className="px-2" style={{ maxWidth: 1200 }}>
                        <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>{errorMessage}</Alert>
                    </Container>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                        <h5>Chưa có đơn hàng</h5>
                        <p className="text-muted">Bạn chưa có đơn hàng nào trong mục này.</p>
                    </div>
                ) : (
                    <Container fluid className="px-2" style={{ maxWidth: 1200 }}>
                        {orders.map((order) => {
                            const info = getStatus(order.status);
                            return (
                                <Card key={order.id} className="border-0 shadow-sm mb-3" style={{ borderRadius: 6 }}>
                                    <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
                                        <div>
                                            <span className="text-muted small">Mã đơn hàng </span>
                                            <strong>#{order.id}</strong>
                                        </div>
                                        <Badge bg={info.bg} className="px-3 py-2" style={{ color: info.color, backgroundColor: info.bg === "warning" ? "#ffc107" : undefined }}>
                                            {info.text}
                                        </Badge>
                                    </Card.Header>

                                    <Card.Body className="bg-white">
                                        <div className="text-muted small mb-3">{formatDate(order.created_date)}</div>

                                        {order.details?.length > 0 ? (
                                            <div>
                                                {order.details.map((item) => (
                                                    <div key={item.id} className="d-flex align-items-center mb-3" style={{ borderBottom: "1px solid #f1f1f1", paddingBottom: 12 }}>
                                                        <img src={getImage(item.image)} alt={item.product_name} style={{ width: 80, height: 80, objectFit: "cover", border: "1px solid #eee", borderRadius: 4, flexShrink: 0 }} />
                                                        <div className="ms-3 flex-grow-1">
                                                            <div className="fw-semibold">{item.product_name}</div>
                                                            <div className="text-muted small mt-1">
                                                                {item.color && <span>Màu: {item.color}</span>}
                                                                {item.color && item.size && <span> | </span>}
                                                                {item.size && <span>Size: {item.size}</span>}
                                                            </div>
                                                            <div className="text-muted small mt-1">x{item.quantity}</div>
                                                        </div>
                                                        <div className="text-end ms-3">
                                                            <div className="text-danger" style={{ fontSize: 15 }}>{formatPrice(item.unit_price)} ₫</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-muted small">Không có thông tin sản phẩm.</div>
                                        )}

                                        <Row className="align-items-end mt-3">
                                            <Col>
                                                <div className="fw-semibold">
                                                    {order.payment_method_display === "vnpay" ? "VNPay" : order.payment_method_display === "cod" ? "Thanh toán khi nhận hàng" : order.payment_method_display}
                                                </div>
                                                <div className="small mt-1" style={{ color: "#009688" }}>
                                                    {order.payment_status === "paid" ? "Đã thanh toán" : order.payment_status === "failed" ? "Thanh toán thất bại" : "Chưa thanh toán"}
                                                </div>
                                            </Col>
                                            <Col xs="auto" className="text-end">
                                                <div className="text-muted" style={{ fontSize: 13 }}>Thành tiền</div>
                                                <div className="text-danger fw-bold" style={{ fontSize: 18 }}>{formatPrice(order.total_amount)} ₫</div>
                                            </Col>
                                        </Row>
                                    </Card.Body>

                                    <Card.Footer className="bg-white d-flex justify-content-end gap-2 py-3">
                                        {order.status === "PENDING" && order.payment_method_display === "vnpay" && order.payment_status !== "paid" && (
                                            <Button variant="warning" size="sm" onClick={() => payVNPay(order)}>Thanh toán</Button>
                                        )}
                                        <Button variant="outline-dark" size="sm" onClick={() => viewDetail(order)}>
                                            <FaEye className="me-1" />Xem chi tiết
                                        </Button>
                                        {order.status === "PENDING" && (
                                            <Button variant="outline-danger" size="sm" onClick={() => cancelOrder(order)}>
                                                <FaTimes className="me-1" />Hủy đơn
                                            </Button>
                                        )}
                                    </Card.Footer>
                                </Card>
                            );
                        })}
                    </Container>
                )}
            </Container>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : selectedOrder ? (
                        <>
                            <div className="mb-3">
                                <strong>Địa chỉ giao hàng:</strong>
                                <div>{selectedOrder.shipping_address}</div>
                            </div>
                            <div className="mb-3">
                                <strong>Số điện thoại:</strong>
                                <div>{selectedOrder.phone}</div>
                            </div>
                            <hr />
                            {details.map((item) => (
                                <div key={item.id} className="d-flex align-items-center mb-3">
                                    <img src={getImage(item.image)} alt={item.product_name} style={{ width: 90, height: 90, objectFit: "cover", border: "1px solid #eee", borderRadius: 4 }} />
                                    <div className="ms-3 flex-grow-1">
                                        <div className="fw-semibold">{item.product_name}</div>
                                        <div className="text-muted small">
                                            {item.color && `Màu: ${item.color}`}
                                            {item.color && item.size && " | "}
                                            {item.size && `Size: ${item.size}`}
                                        </div>
                                        <div className="small">Số lượng: {item.quantity}</div>
                                    </div>
                                    <div className="text-danger fw-semibold">{formatPrice(item.unit_price)} ₫</div>
                                </div>
                            ))}
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span>Tổng tiền</span>
                                <strong className="text-danger fs-5">{formatPrice(selectedOrder.total_amount)} ₫</strong>
                            </div>
                        </>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Order;
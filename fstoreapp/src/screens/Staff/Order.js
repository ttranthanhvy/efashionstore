import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { FaEye, FaCheck, FaTruck } from "react-icons/fa";
import Apis, { endpoints } from "../../configs/Apis";

const StaffOrder = () => {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("");

    const loadOrders = async () => {
        try {
            setLoading(true);
            let url = endpoints["staff-orders"];
            if (status) url += `?status=${status}`;
            const res = await Apis.get(url);
            setOrders(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể tải danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [status]);

    const viewOrder = async id => {
        try {
            const res = await Apis.get(endpoints["staff-order"](id));
            setSelectedOrder(res.data);
            setShowModal(true);
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể tải chi tiết đơn hàng.");
        }
    };

    const confirmOrder = async id => {
        try {
            await Apis.patch(endpoints["staff-order-confirm"](id));
            setMessage("Xác nhận đơn hàng thành công.");
            loadOrders();
            if (selectedOrder?.id === id) viewOrder(id);
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể xác nhận đơn hàng.");
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await Apis.patch(endpoints["staff-order-status"](id), { status: newStatus });
            setMessage("Cập nhật trạng thái thành công.");
            loadOrders();
            if (selectedOrder?.id === id) viewOrder(id);
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể cập nhật trạng thái.");
        }
    };

    const getStatusText = status => {
        switch (status) {
            case "PENDING": return "Chờ xác nhận";
            case "CONFIRMED": return "Đã xác nhận";
            case "SHIPPED": return "Đang giao";
            case "COMPLETED": return "Hoàn thành";
            case "CANCELLED": return "Đã hủy";
            default: return status;
        }
    };

    const getStatusVariant = status => {
        switch (status) {
            case "PENDING": return "warning";
            case "CONFIRMED": return "info";
            case "SHIPPED": return "primary";
            case "COMPLETED": return "success";
            case "CANCELLED": return "danger";
            default: return "secondary";
        }
    };

    const formatMoney = value => Number(value || 0).toLocaleString("vi-VN") + " ₫";

    return (
        <Container fluid className="py-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">Quản lý đơn hàng</h3>
                    <p className="text-muted mb-0">Xem và xử lý các đơn hàng của khách hàng</p>
                </div>
                <Form.Select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "200px" }}>
                    <option value="">Tất cả đơn hàng</option>
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="SHIPPED">Đang giao</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                </Form.Select>
            </div>

            {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center text-muted py-5">Không có đơn hàng.</div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Khách hàng</th><th>Địa chỉ</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td className="fw-semibold">{order.username}</td>
                                        <td style={{ maxWidth: "220px" }}>{order.shipping_address}</td>
                                        <td><div>{order.payment_method}</div><small className="text-muted">{order.payment_status}</small></td>
                                        <td className="fw-bold">{formatMoney(order.total_amount)}</td>
                                        <td><Badge bg={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge></td>
                                        <td>{new Date(order.created_date).toLocaleString("vi-VN")}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button variant="outline-secondary" size="sm" onClick={() => viewOrder(order.id)}><FaEye /></Button>
                                                {order.status === "PENDING" && <Button variant="success" size="sm" onClick={() => confirmOrder(order.id)}><FaCheck /></Button>}
                                                {order.status === "CONFIRMED" && <Button variant="primary" size="sm" onClick={() => updateStatus(order.id, "SHIPPED")}><FaTruck /></Button>}
                                                {order.status === "SHIPPED" && <Button variant="success" size="sm" onClick={() => updateStatus(order.id, "COMPLETED")}>Hoàn tất</Button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}><strong>Khách hàng:</strong><div>{selectedOrder.username}</div></Col>
                                <Col md={6}><strong>Trạng thái:</strong><div><Badge bg={getStatusVariant(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</Badge></div></Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}><strong>Địa chỉ giao hàng:</strong><div>{selectedOrder.shipping_address}</div></Col>
                                <Col md={6}><strong>Thanh toán:</strong><div>{selectedOrder.payment_method} - {selectedOrder.payment_status}</div></Col>
                            </Row>
                            <hr />
                            <h5 className="fw-bold mb-3">Sản phẩm</h5>
                            <Table responsive bordered>
                                <thead>
                                    <tr><th>Sản phẩm</th><th>Phân loại</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.details?.map(detail => (
                                        <tr key={detail.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    {detail.image && <img src={detail.image} alt={detail.product_name} style={{ width: "55px", height: "55px", objectFit: "cover", borderRadius: "6px" }} />}
                                                    <span>{detail.product_name}</span>
                                                </div>
                                            </td>
                                            <td>{detail.color && `Màu: ${detail.color}`}{detail.color && detail.size && " - "}{detail.size && `Size: ${detail.size}`}</td>
                                            <td>{formatMoney(detail.unit_price)}</td>
                                            <td>{detail.quantity}</td>
                                            <td className="fw-semibold">{formatMoney(Number(detail.unit_price) * Number(detail.quantity))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="text-end"><h5 className="fw-bold">Tổng tiền: {formatMoney(selectedOrder.total_amount)}</h5></div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedOrder?.status === "PENDING" && <Button variant="success" onClick={() => confirmOrder(selectedOrder.id)}><FaCheck className="me-2" />Xác nhận đơn</Button>}
                    {selectedOrder?.status === "CONFIRMED" && <Button variant="primary" onClick={() => updateStatus(selectedOrder.id, "SHIPPED")}><FaTruck className="me-2" />Chuyển sang đang giao</Button>}
                    {selectedOrder?.status === "SHIPPED" && <Button variant="success" onClick={() => updateStatus(selectedOrder.id, "COMPLETED")}>Hoàn thành đơn</Button>}
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default StaffOrder;
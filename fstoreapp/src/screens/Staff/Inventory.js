import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { FaBoxes, FaPlus, FaSyncAlt } from "react-icons/fa";
import MySpinner from "../../components/MySpinner";
import Apis, { endpoints } from "../../configs/Apis";
import { staffColors, staffStyles } from "./StaffStyle";

const StaffInventory = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const showMessage = msg => {
        setMessage(msg);
        setError("");
        setTimeout(() => setMessage(""), 3000);
    };

    const showError = msg => {
        setError(msg);
        setMessage("");
        setTimeout(() => setError(""), 3000);
    };

    const loadVariants = async () => {
        try {
            setLoading(true);
            const res = await Apis.get(endpoints["staff-restock"]);
            setVariants(res.data.results || []);
        } catch (e) {
            showError(e.response?.data?.detail || "Không thể tải danh sách tồn kho.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVariants();
    }, []);

    const getImageUrl = image => !image ? null : image.startsWith("http") ? image : `https://res.cloudinary.com/kcord2gk/${image}`;
    const formatMoney = price => Number(price || 0).toLocaleString("vi-VN") + " VNĐ";

    const openInventory = variant => {
        setSelectedVariant(variant);
        setQuantity("");
        setError("");
        setMessage("");
        setShowModal(true);
    };

    const updateInventory = async e => {
        e.preventDefault();
        if (!quantity || Number(quantity) <= 0) {
            showError("Số lượng nhập phải lớn hơn 0.");
            return;
        }
        try {
            setSaving(true);
            setError("");
            await Apis.patch(endpoints["staff-inventory"](selectedVariant.id), { quantity: Number(quantity) });
            setShowModal(false);
            setSelectedVariant(null);
            setQuantity("");
            showMessage("Nhập kho thành công.");
            await loadVariants();
        } catch (e) {
            const data = e.response?.data;
            showError(data?.detail || Object.values(data || {}).flat().join(", ") || "Không thể nhập kho.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Container className="py-5 text-center"><MySpinner /></Container>;

    return (
        <div style={staffStyles.page}>
            <Container fluid className="px-4 py-4">
                <div style={{ ...staffStyles.hero, marginBottom: "24px" }}>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <div style={staffStyles.logo}><FaBoxes /></div>
                            <div className="ms-3">
                                <h3 className="mb-1 fw-bold">Quản lý kho hàng</h3>
                                <p className="mb-0">Theo dõi và nhập thêm sản phẩm vào kho</p>
                            </div>
                        </div>
                        <Button style={staffStyles.secondaryButton} onClick={loadVariants}><FaSyncAlt className="me-2" />Làm mới</Button>
                    </div>
                </div>

                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Row className="g-4 mb-4">
                    <Col md={4}>
                        <Card className="border-0" style={staffStyles.card}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center">
                                    <div style={staffStyles.iconBox}><FaBoxes /></div>
                                    <div className="ms-3">
                                        <small style={staffStyles.mutedText}>Variant cần nhập</small>
                                        <h3 className="fw-bold mb-0" style={{ color: staffColors.midnightLagoon }}>{variants.length}</h3>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0" style={staffStyles.card}>
                    <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="mb-1" style={staffStyles.sectionTitle}>Danh sách cần nhập kho</h5>
                                <small style={staffStyles.mutedText}>Các variant có tồn kho thấp hơn hoặc bằng tồn tối thiểu</small>
                            </div>
                        </div>

                        {variants.length === 0 ? (
                            <div className="text-center py-5" style={staffStyles.mutedText}>
                                <FaBoxes size={40} className="mb-3" />
                                <div>Kho hiện tại không có variant cần nhập.</div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead>
                                        <tr style={staffStyles.tableHeader}>
                                            <th>Ảnh</th><th>Variant ID</th><th>Màu</th><th>Size</th><th>Giá</th><th>Tồn kho</th><th>Tồn tối thiểu</th><th className="text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map(v => (
                                            <tr key={v.id}>
                                                <td>
                                                    {v.image ? <img src={getImageUrl(v.image)} alt={v.color || v.size || "Variant"} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px" }} /> : <div style={{ width: "60px", height: "60px", borderRadius: "10px", backgroundColor: staffColors.hover }} />}
                                                </td>
                                                <td><span style={staffStyles.badge}>#{v.id}</span></td>
                                                <td>{v.color || "-"}</td>
                                                <td>{v.size || "-"}</td>
                                                <td className="fw-semibold">{formatMoney(v.price)}</td>
                                                <td><span className="fw-bold" style={{ color: staffColors.midnightLagoon }}>{v.stock}</span></td>
                                                <td>{v.min_stock}</td>
                                                <td className="text-center"><Button size="sm" style={staffStyles.primaryButton} onClick={() => openInventory(v)}><FaPlus className="me-2" />Nhập kho</Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: staffColors.mistySky, border: "none" }}>
                    <Modal.Title style={{ color: staffColors.midnightLagoon, fontWeight: "700" }}>Nhập kho</Modal.Title>
                </Modal.Header>
                <Form onSubmit={updateInventory}>
                    <Modal.Body className="p-4">
                        {selectedVariant && (
                            <>
                                <div style={staffStyles.infoBox} className="mb-4">
                                    <Row className="g-3">
                                        <Col xs={6}><small style={staffStyles.mutedText}>Variant ID</small><div className="fw-bold">#{selectedVariant.id}</div></Col>
                                        <Col xs={6}><small style={staffStyles.mutedText}>Giá</small><div className="fw-bold">{formatMoney(selectedVariant.price)}</div></Col>
                                        <Col xs={6}><small style={staffStyles.mutedText}>Màu</small><div className="fw-semibold">{selectedVariant.color || "-"}</div></Col>
                                        <Col xs={6}><small style={staffStyles.mutedText}>Size</small><div className="fw-semibold">{selectedVariant.size || "-"}</div></Col>
                                        <Col xs={6}><small style={staffStyles.mutedText}>Tồn hiện tại</small><div className="fw-bold" style={{ color: staffColors.midnightLagoon }}>{selectedVariant.stock}</div></Col>
                                        <Col xs={6}><small style={staffStyles.mutedText}>Tồn tối thiểu</small><div className="fw-bold">{selectedVariant.min_stock}</div></Col>
                                    </Row>
                                </div>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Số lượng nhập</Form.Label>
                                    <Form.Control type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Nhập số lượng" required autoFocus style={staffStyles.input} />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>Hủy</Button>
                        <Button type="submit" style={staffStyles.primaryButton} disabled={saving}>{saving ? "Đang nhập..." : "Xác nhận nhập kho"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffInventory;
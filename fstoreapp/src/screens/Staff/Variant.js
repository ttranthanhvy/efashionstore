import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import Apis, { endpoints } from "../../configs/Apis";
import { staffColors, staffStyles } from "./StaffStyle";

const StaffVariant = ({ productId }) => {
    const [variants, setVariants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [form, setForm] = useState({ color: "", size: "", price: "", stock: "", min_stock: "", image: null });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const loadVariants = async () => {
        try {
            const res = await Apis.get(endpoints.variants(productId));
            setVariants(res.data.results || res.data);
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể tải variant.");
        }
    };

    useEffect(() => {
        loadVariants();
    }, [productId]);

    const getImageUrl = image => !image ? null : image.startsWith("http") ? image : `https://res.cloudinary.com/kcord2gk/${image}`;
    const formatMoney = price => Number(price || 0).toLocaleString("vi-VN") + " VNĐ";

    const openAdd = () => {
        setEditingVariant(null);
        setForm({ color: "", size: "", price: "", stock: "", min_stock: "", image: null });
        setMessage("");
        setError("");
        setShowModal(true);
    };

    const openEdit = variant => {
        setEditingVariant(variant);
        setForm({ color: variant.color || "", size: variant.size || "", price: variant.price || "", stock: variant.stock ?? "", min_stock: variant.min_stock ?? "", image: null });
        setMessage("");
        setError("");
        setShowModal(true);
    };

    const handleChange = e => {
        const { name, value, files } = e.target;
        setForm(prev => ({ ...prev, [name]: files ? files[0] : value }));
    };

    const saveVariant = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");
        try {
            const data = new FormData();
            data.append("color", form.color);
            data.append("size", form.size);
            data.append("price", form.price);
            data.append("stock", form.stock);
            data.append("min_stock", form.min_stock);
            if (form.image) data.append("image", form.image);

            if (editingVariant) {
                const res = await Apis.patch(endpoints["staff-variant"](editingVariant.id), data);
                setVariants(prev => prev.map(v => v.id === editingVariant.id ? res.data : v));
                setMessage("Cập nhật variant thành công.");
            } else {
                const res = await Apis.post(endpoints["staff-product-variants"](productId), data);
                setVariants(prev => [...prev, res.data]);
                setMessage("Thêm variant thành công.");
            }

            setShowModal(false);
            setForm({ color: "", size: "", price: "", stock: "", min_stock: "", image: null });
        } catch (e) {
            const data = e.response?.data;
            setError(data?.detail || Object.values(data || {}).flat().join(", ") || "Không thể lưu variant.");
        } finally {
            setLoading(false);
        }
    };

    const deleteVariant = async id => {
        if (!window.confirm("Bạn có chắc muốn xóa variant này?")) return;
        try {
            await Apis.delete(endpoints["staff-variant"](id));
            setVariants(prev => prev.filter(v => v.id !== id));
            setMessage("Xóa variant thành công.");
            setError("");
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể xóa variant.");
        }
    };

    return (
        <>
            <Card style={staffStyles.card} className="border-0 shadow-sm mt-4">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="mb-1" style={staffStyles.sectionTitle}>Biến thể sản phẩm</h5>
                            <small style={staffStyles.mutedText}>{variants.length} biến thể</small>
                        </div>
                        <Button style={staffStyles.primaryButton} onClick={openAdd}>
                            <FaPlus className="me-2" />Thêm variant
                        </Button>
                    </div>

                    {message && <Alert variant="success" onClose={() => setMessage("")} dismissible>{message}</Alert>}
                    {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

                    {variants.length === 0 ? (
                        <div className="text-center py-5" style={staffStyles.mutedText}>Chưa có variant nào.</div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead>
                                    <tr style={staffStyles.tableHeader}>
                                        <th>Ảnh</th>
                                        <th>Màu</th>
                                        <th>Size</th>
                                        <th>Giá</th>
                                        <th>Tồn kho</th>
                                        <th>Tồn tối thiểu</th>
                                        <th className="text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map(v => (
                                        <tr key={v.id}>
                                            <td>
                                                {v.image ? (
                                                    <img src={getImageUrl(v.image)} alt={v.color} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px" }} />
                                                ) : (
                                                    <div style={{ width: "60px", height: "60px", borderRadius: "10px", backgroundColor: staffColors.hover }} />
                                                )}
                                            </td>
                                            <td><span style={staffStyles.badge}>{v.color || "-"}</span></td>
                                            <td>{v.size || "-"}</td>
                                            <td className="fw-semibold">{formatMoney(v.price)}</td>
                                            <td>{v.stock}</td>
                                            <td>{v.min_stock}</td>
                                            <td className="text-center">
                                                <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => openEdit(v)}>
                                                    <FaEdit />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => deleteVariant(v.id)}>
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: staffColors.mistySky, border: "none" }}>
                    <Modal.Title style={{ color: staffColors.midnightLagoon, fontWeight: "700" }}>
                        {editingVariant ? "Chỉnh sửa variant" : "Thêm variant"}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={saveVariant}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Màu sắc</Form.Label>
                                    <Form.Control name="color" value={form.color} onChange={handleChange} required style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Kích thước</Form.Label>
                                    <Form.Control name="size" value={form.size} onChange={handleChange} required style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Giá</Form.Label>
                                    <Form.Control type="number" name="price" value={form.price} onChange={handleChange} min="0" required style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tồn kho</Form.Label>
                                    <Form.Control type="number" name="stock" value={form.stock} onChange={handleChange} min="0" required style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tồn tối thiểu</Form.Label>
                                    <Form.Control type="number" name="min_stock" value={form.min_stock} onChange={handleChange} min="0" required style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Ảnh variant</Form.Label>
                                    <Form.Control type="file" name="image" accept="image/*" onChange={handleChange} style={staffStyles.input} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>Hủy</Button>
                        <Button type="submit" style={staffStyles.primaryButton} disabled={loading}>
                            {loading ? "Đang lưu..." : editingVariant ? "Lưu thay đổi" : "Thêm variant"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default StaffVariant;
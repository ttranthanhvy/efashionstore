import { useEffect, useState } from "react";
import MySpinner from "../../components/MySpinner";
import Apis, { endpoints } from "../../configs/Apis";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { staffColors, staffStyles } from "./StaffStyle";
import StaffVariant from "./Variant";

const StaffProductDetail = () => {
    const { productId } = useParams();
    const nav = useNavigate();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", description: "", price: "", category: "" });

    const loadProduct = async () => {
        try {
            const res = await Apis.get(endpoints["product-details"](productId));
            setProduct(res.data);
            setForm({ name: res.data.name || "", description: res.data.description || "", price: res.data.price || "", category: res.data.category || "" });
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể tải sản phẩm.");
        }
    };

    const loadCategories = async () => {
        try {
            const res = await Apis.get(endpoints.categories);
            setCategories(res.data.results || res.data);
        } catch (e) {
            console.log(e.response?.data);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([loadProduct(), loadCategories()]);
            setLoading(false);
        };
        loadData();
    }, [productId]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const getImageUrl = image => !image ? null : image.startsWith("http") ? image : `https://res.cloudinary.com/kcord2gk/${image}`;

    const getCategoryName = id => categories.find(c => c.id === id)?.name || "-";

    const saveProduct = async e => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            let data;
            if (thumbnail) {
                data = new FormData();
                data.append("name", form.name);
                data.append("description", form.description);
                data.append("price", form.price);
                data.append("category", form.category);
                data.append("thumbnail", thumbnail);
            } else {
                data = form;
            }
            const res = await Apis.patch(endpoints["staff-product"](productId), data);
            setProduct(res.data);
            setForm({ name: res.data.name || "", description: res.data.description || "", price: res.data.price || "", category: res.data.category || "" });
            setThumbnail(null);
            setMessage("Cập nhật sản phẩm thành công.");
        } catch (e) {
            setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || "Không thể cập nhật sản phẩm.");
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await Apis.delete(endpoints["staff-product"](productId));
            nav("/staff/products");
        } catch (e) {
            setError(e.response?.data?.detail || "Không thể xóa sản phẩm.");
        }
    };

    const formatMoney = price => Number(price || 0).toLocaleString("vi-VN") + " VNĐ";

    if (loading) return <Container className="py-5 text-center"><MySpinner /></Container>;

    if (!product) return <Container className="py-5"><Alert variant="danger">Không tìm thấy sản phẩm.</Alert><Button style={staffStyles.primaryButton} onClick={() => nav("/staff/products")}><FaArrowLeft className="me-2" />Quay lại</Button></Container>;

    return (
        <div style={staffStyles.page}>
            <Container fluid className="px-4 py-4">
                <Button style={staffStyles.secondaryButton} className="mb-4" onClick={() => nav("/staff/products")}><FaArrowLeft className="me-2" />Quay lại</Button>

                {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}
                {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

                <Card className="border-0 mb-4" style={staffStyles.card}>
                    <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1" style={staffStyles.sectionTitle}>Chỉnh sửa sản phẩm</h3>
                                <p className="mb-0" style={staffStyles.mutedText}>Cập nhật thông tin sản phẩm</p>
                            </div>
                            <Button style={staffStyles.dangerButton} variant="outline-danger" onClick={deleteProduct}><FaTrash className="me-2" />Xóa sản phẩm</Button>
                        </div>

                        <Form onSubmit={saveProduct}>
                            <Row className="g-4">
                                <Col md={4}>
                                    <div className="text-center">
                                        {getImageUrl(product.thumbnail) ? <img src={getImageUrl(product.thumbnail)} alt={product.name} style={{ width: "100%", height: 350, objectFit: "contain", borderRadius: 14, backgroundColor: staffColors.white, transition: "transform .3s ease" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} /> : <div className="d-flex align-items-center justify-content-center" style={{ width: "100%", height: 350, borderRadius: 14, backgroundColor: staffColors.hover, color: staffColors.muted }}>Không có ảnh</div>}
                                        <Form.Group className="mt-3 text-start">
                                            <Form.Label className="fw-semibold" style={{ color: staffColors.text }}>Thay đổi hình ảnh</Form.Label>
                                            <Form.Control type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0] || null)} style={staffStyles.input} />
                                        </Form.Group>
                                    </div>
                                </Col>

                                <Col md={8}>
                                    <Row className="g-3">
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold" style={{ color: staffColors.text }}>Tên sản phẩm</Form.Label>
                                                <Form.Control name="name" value={form.name} onChange={handleChange} required style={staffStyles.input} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold" style={{ color: staffColors.text }}>Giá</Form.Label>
                                                <Form.Control type="number" min="0" name="price" value={form.price} onChange={handleChange} required style={staffStyles.input} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold" style={{ color: staffColors.text }}>Danh mục</Form.Label>
                                                <Form.Select name="category" value={form.category} onChange={handleChange} required style={staffStyles.input}>
                                                    <option value="">Chọn danh mục</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold" style={{ color: staffColors.text }}>Mô tả</Form.Label>
                                                <Form.Control as="textarea" rows={8} name="description" value={form.description} onChange={handleChange} style={staffStyles.input} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <div style={staffStyles.infoBox}>
                                                <Row>
                                                    <Col md={4}>
                                                        <small style={staffStyles.mutedText}>Đã bán</small>
                                                        <div className="fw-bold mt-1" style={{ color: staffColors.midnightLagoon }}>{product.quantity_sold || 0}</div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <small style={staffStyles.mutedText}>Đánh giá</small>
                                                        <div className="fw-bold mt-1" style={{ color: staffColors.midnightLagoon }}>★ {product.average_rating || "0.0"}</div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <small style={staffStyles.mutedText}>Danh mục hiện tại</small>
                                                        <div className="fw-bold mt-1" style={{ color: staffColors.midnightLagoon }}>{getCategoryName(product.category)}</div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>

                                        <Col md={12}>
                                            <div className="text-end">
                                                <Button type="submit" disabled={saving} style={staffStyles.primaryButton}>
                                                    <FaEdit className="me-2" />{saving ? "Đang lưu..." : "Lưu thay đổi"}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Form>
                    </Card.Body>
                </Card>

                <StaffVariant productId={productId} />
            </Container>
        </div>
    );
};

export default StaffProductDetail;
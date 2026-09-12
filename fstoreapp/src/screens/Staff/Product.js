import { useEffect, useState } from "react";
import MySpinner from "../../components/MySpinner";
import Apis, { endpoints } from "../../configs/Apis";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { staffColors, staffStyles } from "./StaffStyle";

const StaffProduct = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q] = useSearchParams();
    const [page, setPage] = useState(1);
    const [productsPage, setProductsPage] = useState(null);
    const [keyword, setKeyword] = useState(q.get("kw") || "");
    const [hoverId, setHoverId] = useState(null);
    const nav = useNavigate();

    const loadProducts = async () => {
        try {
            setLoading(true);
            let url = `${endpoints.products}?page=${page}`;
            const cateId = q.get("category");
            const parentCateId = q.get("parent_category");
            const kw = q.get("kw");

            if (kw) {
                url = `${endpoints.search}?kw=${encodeURIComponent(kw)}&page=${page}`;
            } else {
                if (cateId) url += `&category=${cateId}`;
                if (parentCateId) url += `&parent_category=${parentCateId}`;
            }

            const res = await Apis.get(url);
            setProducts(res.data.results || []);
            setProductsPage(res.data);
        } catch (ex) {
            console.log(ex);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [q, page]);

    useEffect(() => {
        setPage(1);
        setKeyword(q.get("kw") || "");
    }, [q]);

    const handleSearch = e => {
        e.preventDefault();
        const value = keyword.trim();
        nav(value ? `/staff/products?kw=${encodeURIComponent(value)}` : "/staff/products");
    };

    const getImageUrl = image => !image ? null : image.startsWith("http") ? image : `https://res.cloudinary.com/kcord2gk/${image}`;

    return (
        <div style={staffStyles.page}>
            <Container fluid className="px-4 py-4">
                <div style={staffStyles.header} className="mb-4">
                    <Row className="align-items-center">
                        <Col md={7}>
                            <div className="d-flex align-items-center gap-3">
                                <div style={staffStyles.logo}>F</div>
                                <div>
                                    <h3 className="fw-bold mb-1">Quản lý sản phẩm</h3>
                                    <p className="mb-0" style={{ color: staffColors.lightText }}>Xem, tìm kiếm và quản lý sản phẩm của cửa hàng</p>
                                </div>
                            </div>
                        </Col>
                        <Col md={5} className="text-md-end mt-3 mt-md-0">
                            <Button style={staffStyles.primaryButton} onClick={() => nav("/staff/products/new")}>
                                <FaPlus className="me-2" /> Thêm sản phẩm
                            </Button>
                        </Col>
                    </Row>
                </div>

                <Card className="border-0 mb-4" style={staffStyles.card}>
                    <Card.Body className="p-3">
                        <Form onSubmit={handleSearch}>
                            <div className="d-flex gap-2">
                                <div className="position-relative flex-grow-1">
                                    <FaSearch className="position-absolute top-50 translate-middle-y ms-3" style={{ color: staffColors.muted }} />
                                    <Form.Control type="text" placeholder="Tìm kiếm sản phẩm..." value={keyword} onChange={e => setKeyword(e.target.value)} className="ps-5" style={staffStyles.input} />
                                </div>
                                <Button type="submit" style={staffStyles.primaryButton}>
                                    Tìm kiếm
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 className="mb-1" style={staffStyles.sectionTitle}>Danh sách sản phẩm</h5>
                        <span style={{ color: staffColors.muted, fontSize: "13px" }}>
                            {q.get("kw") ? `Kết quả tìm kiếm cho "${q.get("kw")}"` : "Tất cả sản phẩm"}
                        </span>
                    </div>
                    {productsPage && (
                        <span style={staffStyles.badge}>
                            Trang {page}
                        </span>
                    )}
                </div>

                {products.length === 0 && !loading && (
                    <Alert className="border-0" style={{ backgroundColor: "#EEF2F5", color: staffColors.midnightLagoon }}>
                        Không có sản phẩm nào!
                    </Alert>
                )}

                <Row className="g-4">
                    {products.map(p => (
                        <Col xs={6} md={4} lg={3} key={p.id}>
                            <Card
                                onClick={() => nav(`/staff/products/${p.id}`)}
                                className="border-0 h-100"
                                style={hoverId === p.id ? { ...staffStyles.card, ...staffStyles.cardHover } : staffStyles.card}
                                onMouseEnter={() => setHoverId(p.id)}
                                onMouseLeave={() => setHoverId(null)}
                            >
                                <div style={{ overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                                    {getImageUrl(p.thumbnail) ? (
                                        <img src={getImageUrl(p.thumbnail)} alt={p.name} style={hoverId === p.id ? { ...staffStyles.productImage, ...staffStyles.productImageHover } : staffStyles.productImage} />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center" style={{ ...staffStyles.productImage, color: staffColors.muted }}>
                                            Không có ảnh
                                        </div>
                                    )}
                                </div>

                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span style={{ ...staffStyles.badge, fontSize: "11px", padding: "4px 9px" }}>
                                            {p.category?.name || "FASHION"}
                                        </span>
                                        <span className="fw-semibold" style={{ color: staffColors.midnightLagoon, fontSize: "13px" }}>
                                            ★ {p.average_rating || "0.0"}
                                        </span>
                                    </div>

                                    <Card.Title className="fw-semibold mb-2" style={{ color: staffColors.text, fontSize: "16px", lineHeight: "1.4", height: "45px", overflow: "hidden" }}>
                                        {p.name}
                                    </Card.Title>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <Card.Text className="fw-bold mb-0" style={{ color: staffColors.midnightLagoon, fontSize: "16px" }}>
                                            {Number(p.price || 0).toLocaleString("vi-VN")} VNĐ
                                        </Card.Text>
                                        <span style={{ color: staffColors.muted, fontSize: "12px" }}>
                                            Đã bán {p.quantity_sold || 0}
                                        </span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {loading && (
                    <div className="text-center mt-5">
                        <MySpinner />
                    </div>
                )}

                {productsPage && products.length > 0 && (
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                        <Button style={staffStyles.secondaryButton} disabled={!productsPage.previous} onClick={() => setPage(page - 1)}>
                            <FaChevronLeft className="me-2" /> Trang trước
                        </Button>
                        <span className="fw-bold px-2" style={{ color: staffColors.midnightLagoon }}>
                            Trang {page}
                        </span>
                        <Button style={staffStyles.primaryButton} disabled={!productsPage.next} onClick={() => setPage(page + 1)}>
                            Trang sau <FaChevronRight className="ms-2" />
                        </Button>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default StaffProduct;
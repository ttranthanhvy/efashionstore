import { useContext, useEffect, useState } from "react";
import MySpinner from "../../components/MySpinner";
import Apis, { endpoints } from "../../configs/Apis";
import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MyUserContext } from "../../configs/Context";

const Home = () => {
    const [products, setProduct] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q] = useSearchParams();
    const [page, setPage] = useState(1);
    const [productsPage, setProductsPage] = useState(null);
    const [user] = useContext(MyUserContext);
    const nav = useNavigate();

    const loadProducts = async () => {
        try {
            setLoading(true);
            let url = `${endpoints["products"]}?page=${page}`;
            const cateId = q.get("category");
            const parentCateId = q.get("parent_category");
            if (cateId) url = `${url}&category=${cateId}`;
            if (parentCateId) url = `${url}&parent_category=${parentCateId}`;
            const kw = q.get("kw");
            if (kw) url = `${endpoints["search"]}?kw=${encodeURIComponent(kw)}&page=${page}`;
            const res = await Apis.get(url);
            setProduct(res.data.results);
            setProductsPage(res.data);
        } catch (ex) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [q, page]);

    useEffect(() => {
        setPage(1);
    }, [q]);

    return (
        <>
            <Container fluid className="px-4 py-4">
                <div className="rounded-4 shadow-sm p-4" style={{ color: "#FFF7E6" }}>
                    <div className="mb-4">
                        <h3 className="fw-bold mb-1" style={{ color: "#222" }}>Tất cả sản phẩm</h3>
                        <p className="text-muted mb-0">Khám phá những sản phẩm của chúng tôi</p>
                    </div>
                    {products.length === 0 && !loading && <Alert variant="info" className="mt-2">KHÔNG có sản phẩm nào!</Alert>}
                    <Row className="g-4">
                        {products.map(p => (
                            <Col xs={6} md={4} lg={3} key={p.id}>
                                <Card onClick={() => nav(`/product/${p.id}`)} className="border-0 h-100 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
                                    <Card.Img variant="top" src={`https://res.cloudinary.com/kcord2gk/${p.thumbnail}`} style={{ width: "100%", height: "300px", objectFit: "contain", objectPosition: "center", backgroundColor: "#fff" }} />
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="fw-bold" style={{ color: "#B46472", fontSize: "12px" }}>{p.category?.name || "FASHION"}</span>
                                            <span className="fw-semibold" style={{ color: "#5c3038", fontSize: "13px" }}>★ {p.average_rating || "0.0"}</span>
                                        </div>
                                        <Card.Title className="fw-semibold mb-2" style={{ fontSize: "16px", lineHeight: "1.4", height: "45px", overflow: "hidden" }}>{p.name}</Card.Title>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Card.Text className="fw-bold mb-0" style={{ color: "#B46472", fontSize: "17px" }}>{Number(p.price).toLocaleString("vi-VN")} VNĐ</Card.Text>
                                            <span className="text-muted" style={{ fontSize: "13px" }}>Đã bán {p.quantity_sold || 0}</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {loading && <div className="text-center mt-4"><MySpinner /></div>}
                </div>
            </Container>
            {productsPage && <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                <Button variant="outline-secondary" disabled={!productsPage.previous} onClick={() => setPage(page - 1)}>Trang trước</Button>
                <span className="fw-semibold">Trang {page}</span>
                <Button variant="outline-secondary" disabled={!productsPage.next} onClick={() => setPage(page + 1)}>Trang sau</Button>
            </div>}
        </>
    );
};

export default Home;
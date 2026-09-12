import { Col, Container, Row } from "react-bootstrap";

const Footer = () => {
    return (
        <footer className="footer mt-5 py-5">
            <Container>
                <Row>
                    <Col md={4}>
                        <h5 className="fw-bold">Fashion Store</h5>
                        <p className="mb-0">Thời trang hiện đại dành cho bạn.</p>
                    </Col>
                    <Col md={2}>
                        <h6 className="fw-bold">SHOP</h6>
                        <p>Nam</p>
                        <p>Nữ</p>
                    </Col>
                    <Col md={3}>
                        <h6 className="fw-bold">HỖ TRỢ</h6>
                        <p>Liên hệ</p>
                        <p>Chính sách đổi trả</p>
                        <p>Chính sách giao hàng</p>
                    </Col>
                    <Col md={3}>
                        <h6 className="fw-bold">LIÊN HỆ</h6>
                        <p>Email: support@fashionstore.com</p>
                        <p>Hotline: 0123 456 789</p>
                    </Col>
                </Row>
                <hr />
                <div className="text-center small">Fashion Store © 2026</div>
            </Container>
        </footer>
    );
};

export default Footer;
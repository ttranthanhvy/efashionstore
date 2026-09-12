import { Container, Card, Button } from "react-bootstrap";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const PaymentStatus = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("order_id");
    const success = location.pathname === "/payment/success";

    return (
        <Container className="py-5">
            <Card className="border-0 shadow-sm mx-auto text-center" style={{ maxWidth: "600px" }}>
                <Card.Body className="py-5 px-4">
                    {success ? (
                        <>
                            <FaCheckCircle size={80} className="text-success mb-4" />
                            <h2 className="fw-bold text-success mb-3">Thanh toán thành công!</h2>
                            <p className="text-muted mb-4">Đơn hàng #{orderId} đã được thanh toán thành công.</p>
                        </>
                    ) : (
                        <>
                            <FaTimesCircle size={80} className="text-danger mb-4" />
                            <h2 className="fw-bold text-danger mb-3">Thanh toán thất bại</h2>
                            <p className="text-muted mb-4">Thanh toán cho đơn hàng #{orderId} không thành công.</p>
                        </>
                    )}
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="outline-secondary" onClick={() => navigate("/")}>Về trang chủ</Button>
                        <Button variant={success ? "success" : "danger"} onClick={() => navigate("/orders")}>Xem đơn hàng</Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PaymentStatus;
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Image, Spinner, Form } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const loadCart = async () => {
        try {
            const res = await Apis.get(endpoints.cart);
            setCart(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const getImageUrl = (image) => {
        if (!image) return "";
        if (image.startsWith("http")) return image;
        return `https://res.cloudinary.com/kcord2gk/${image}`;
    };

    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString("vi-VN") + " ₫";
    };

    const updateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) return;

        if (newQuantity > item.stock) {
            alert(`Chỉ còn ${item.stock} sản phẩm trong kho`);
            return;
        }

        try {
            setUpdating(item.id);
            const res = await Apis.patch(`${endpoints.cart}items/${item.id}/`, { quantity: newQuantity });

            setCart((prev) => ({
                ...prev,
                items: prev.items.map((i) =>
                    i.id === item.id ? { ...i, quantity: res.data.quantity } : i
                )
            }));
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể cập nhật số lượng");
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (id) => {
        const confirmed = window.confirm("Bạn có chắc muốn xóa sản phẩm này không?");
        if (!confirmed) return;

        try {
            await Apis.delete(`${endpoints.cart}items/${id}/`);

            setCart((prev) => ({
                ...prev,
                items: prev.items.filter((item) => item.id !== id)
            }));

            setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể xóa sản phẩm");
        }
    };

    const goToProduct = (productId) => {
        navigate(`/product/${productId}`);
    };

    const toggleItem = (itemId) => {
        setSelectedItems((prev) => {
            if (prev.includes(itemId)) {
                return prev.filter((id) => id !== itemId);
            }
            return [...prev, itemId];
        });
    };

    const toggleAll = () => {
        if (!cart?.items?.length) return;

        if (selectedItems.length === cart.items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.items.map((item) => item.id));
        }
    };

    const selectedCartItems = cart?.items?.filter((item) =>
        selectedItems.includes(item.id)
    ) || [];

    const totalQuantity = selectedCartItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const totalPrice = selectedCartItems.reduce(
        (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
        0
    );

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm");
            return;
        }

        navigate("/checkout", {
            state: {
                type: "cart",
                cartItemIds: selectedItems,
                selectedItems: selectedCartItems,
                totalQuantity,
                totalPrice
            }
        });
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="danger" />
            </Container>
        );
    }

    if (!cart || cart.items?.length === 0) {
        return (
            <Container className="py-5">
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: "70px" }}>🛒</div>
                        <h4 className="fw-bold mt-3">Giỏ hàng trống</h4>
                        <p className="text-muted">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const allSelected = selectedItems.length === cart.items.length;

    return (
        <Container className="py-4">
            <h3 className="fw-bold mb-4">Giỏ hàng</h3>

            <Row>
                <Col md={8}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <Form.Check
                                type="checkbox"
                                label="Chọn tất cả"
                                checked={allSelected}
                                onChange={toggleAll}
                                className="fw-bold"
                            />
                        </Card.Body>
                    </Card>

                    {cart.items.map((item) => (
                        <Card key={item.id} className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col xs={1}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleItem(item.id)}
                                        />
                                    </Col>

                                    <Col xs={3} md={2}>
                                        <div
                                            onClick={() => goToProduct(item.product_id)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <Image
                                                src={getImageUrl(item.thumbnail)}
                                                fluid
                                                rounded
                                                style={{
                                                    width: "100px",
                                                    height: "120px",
                                                    objectFit: "contain"
                                                }}
                                            />
                                        </div>
                                    </Col>

                                    <Col xs={8} md={5}>
                                        <h5
                                            className="fw-bold mb-2"
                                            onClick={() => goToProduct(item.product_id)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {item.product_name || `Sản phẩm #${item.product_variant}`}
                                        </h5>

                                        <p className="text-muted mb-1">
                                            Phân loại: {item.color || "-"}
                                            {item.color && item.size && " / "}
                                            {item.size || ""}
                                        </p>

                                        <p className="text-danger fw-bold mb-1">
                                            {formatPrice(item.price)}
                                        </p>

                                        <p className="text-muted mb-3">
                                            Còn <strong>{item.stock}</strong> sản phẩm
                                        </p>

                                        <div className="d-flex align-items-center">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                style={{ width: "35px", height: "35px" }}
                                                disabled={item.quantity <= 1 || updating === item.id}
                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                            >
                                                −
                                            </Button>

                                            <div
                                                className="d-flex justify-content-center align-items-center"
                                                style={{
                                                    width: "45px",
                                                    height: "35px",
                                                    borderTop: "1px solid #dee2e6",
                                                    borderBottom: "1px solid #dee2e6"
                                                }}
                                            >
                                                {updating === item.id ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    item.quantity
                                                )}
                                            </div>

                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                style={{ width: "35px", height: "35px" }}
                                                disabled={item.quantity >= item.stock || updating === item.id}
                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </Col>

                                    <Col md={4} className="text-end mt-3 mt-md-0">
                                        <p className="text-muted mb-1">
                                            {formatPrice(item.price)} × {item.quantity}
                                        </p>

                                        <h5 className="text-danger fw-bold mb-3">
                                            {formatPrice(Number(item.price) * Number(item.quantity))}
                                        </h5>

                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <FaTrashAlt className="me-1" />
                                            Xóa
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ position: "sticky", top: "20px" }}>
                        <Card.Body>
                            <h5 className="fw-bold mb-4">Tổng đơn hàng</h5>

                            <div className="d-flex justify-content-between mb-3">
                                <span>Đã chọn</span>
                                <strong>{totalQuantity}</strong>
                            </div>

                            <div className="d-flex justify-content-between mb-3">
                                <span>Tạm tính</span>
                                <strong>{formatPrice(totalPrice)}</strong>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="fw-bold">Tổng tiền</span>
                                <h4 className="text-danger fw-bold mb-0">{formatPrice(totalPrice)}</h4>
                            </div>

                            <Button
                                variant="danger"
                                size="lg"
                                className="w-100"
                                disabled={selectedItems.length === 0}
                                onClick={handleCheckout}
                            >
                                Tiến hành đặt hàng
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Cart;
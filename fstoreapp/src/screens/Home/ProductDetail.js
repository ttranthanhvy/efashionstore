import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";
import { Col, Row, Image, Card, Button, Container, Badge, Alert } from "react-bootstrap";
import Rating from "../Home/Rating";
import { MyUserContext } from "../../configs/Context";

const ProductDetail = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [variants, setVariant] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingCart, setAddingCart] = useState(false);
    const nav = useNavigate();
    const [user] = useContext(MyUserContext);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadProduct = async () => {
        try {
            const res = await Apis.get(endpoints["product-details"](productId));
            setProduct(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadVariant = async () => {
        try {
            const res = await Apis.get(endpoints["variants"](productId));
            setVariant(res.data);
            if (res.data.length > 0) {
                setSelectedImage(res.data[0].image);
                if (res.data.length === 1) {
                    setSelectedColor(res.data[0].color || null);
                    setSelectedSize(res.data[0].size || null);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadProduct();
        loadVariant();
    }, [productId]);

    const colors = [...new Set(variants.filter(v => v.color).map(v => v.color))];
    const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];

    const selectedVariant = variants.find(v => {
        const colorMatch = !v.color || v.color === selectedColor;
        const sizeMatch = !v.size || v.size === selectedSize;
        return colorMatch && sizeMatch && (v.color ? v.color === selectedColor : true) && (v.size ? v.size === selectedSize : true);
    });

    const hasColor = colors.length > 0;
    const hasSize = sizes.length > 0;

    const isVariantSelected = () => {
        if (!hasColor && !hasSize) return variants.length > 0;
        if (hasColor && hasSize) return selectedColor !== null && selectedSize !== null;
        if (hasColor) return selectedColor !== null;
        if (hasSize) return selectedSize !== null;
        return false;
    };

    const selectColor = (color) => {
        setSelectedColor(color);
        setQuantity(1);
        const colorVariants = variants.filter(v => v.color === color);
        if (colorVariants.length === 1 && colorVariants[0].size) {
            setSelectedSize(colorVariants[0].size);
            setSelectedImage(colorVariants[0].image);
            return;
        }
        if (selectedSize && !colorVariants.some(v => v.size === selectedSize)) setSelectedSize(null);
        const variant = colorVariants.find(v => !selectedSize || v.size === selectedSize);
        if (variant) setSelectedImage(variant.image);
    };

    const selectSize = (size) => {
        setSelectedSize(size);
        setQuantity(1);
        const sizeVariants = variants.filter(v => v.size === size);
        if (sizeVariants.length === 1 && sizeVariants[0].color) {
            setSelectedColor(sizeVariants[0].color);
            setSelectedImage(sizeVariants[0].image);
            return;
        }
        const variant = sizeVariants.find(v => !selectedColor || v.color === selectedColor);
        if (variant) setSelectedImage(variant.image);
    };

    const getVariantForColor = (color) => variants.find(v => {
        if (v.color !== color) return false;
        if (selectedSize && v.size) return v.size === selectedSize;
        return true;
    });

    const getVariantForSize = (size) => variants.find(v => {
        if (v.size !== size) return false;
        if (selectedColor && v.color) return v.color === selectedColor;
        return true;
    });

    const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

    const increaseQuantity = () => {
        if (!selectedVariant) return;
        if (quantity < selectedVariant.stock) setQuantity(prev => prev + 1);
    };

    const addToCart = async () => {
        if (!user) {
            setErrorMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            setTimeout(() => nav("/login"), 1500);
            return;
        }
        if (!isVariantSelected()) {
            if (hasColor && hasSize) setErrorMessage("Vui lòng chọn màu và kích thước");
            else if (hasColor) setErrorMessage("Vui lòng chọn màu");
            else if (hasSize) setErrorMessage("Vui lòng chọn kích thước");
            else setErrorMessage("Không tìm thấy biến thể sản phẩm");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (!selectedVariant) {
            setErrorMessage("Vui lòng chọn đúng phân loại sản phẩm");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (selectedVariant.stock <= 0) {
            setErrorMessage("Sản phẩm đã hết hàng");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (quantity > selectedVariant.stock) {
            setErrorMessage("Số lượng sản phẩm không đủ");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        try {
            setAddingCart(true);
            await Apis.post(endpoints["cart-items"], { product_variant: selectedVariant.id, quantity: quantity });
            setSuccessMessage("Đã thêm sản phẩm vào giỏ hàng!");
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            if (error.response?.status === 401) setErrorMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            else if (error.response?.status === 409) setErrorMessage(error.response?.data?.detail || "Số lượng sản phẩm không đủ");
            else setErrorMessage("Không thể thêm sản phẩm vào giỏ hàng");
            setTimeout(() => setErrorMessage(""), 3000);
        } finally {
            setAddingCart(false);
        }
    };

    const buyNow = () => {
        if (!user) {
            setErrorMessage("Vui lòng đăng nhập để tiếp tục thanh toán.");
            setTimeout(() => nav("/login"), 1500);
            return;
        }
        if (!isVariantSelected()) {
            setErrorMessage("Vui lòng chọn đầy đủ phân loại sản phẩm");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (!selectedVariant) {
            setErrorMessage("Vui lòng chọn đúng phân loại sản phẩm");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (selectedVariant.stock <= 0) {
            setErrorMessage("Sản phẩm đã hết hàng");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        if (quantity > selectedVariant.stock) {
            setErrorMessage("Số lượng sản phẩm không đủ");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        nav("/checkout", { state: { type: "product", productId: product.id, variantId: selectedVariant.id, quantity: quantity, product: product, variant: selectedVariant } });
    };

    const displayPrice = selectedVariant ? selectedVariant.price : product?.price;
    const displayStock = selectedVariant ? selectedVariant.stock : null;

    return (
        <>
            <Container className="py-4">
                {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>{successMessage}</Alert>}
                {errorMessage && <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}
                <h4 className="fw-bold mb-4">Chi tiết sản phẩm</h4>
                <Card className="border-0 shadow-sm">
                    <Row className="g-0">
                        <Col md={6} className="p-4">
                            <Image src={`https://res.cloudinary.com/kcord2gk/${selectedImage || product?.thumbnail}`} fluid rounded className="w-100" style={{ height: "470px", objectFit: "contain" }} />
                            <div className="d-flex gap-2 mt-3 overflow-auto">
                                {[...new Map(variants.filter(v => v.color && v.image).map(v => [v.color, v])).values()].map(v => (
                                    <div key={v.color} onClick={() => selectColor(v.color)} style={{ width: "75px", height: "75px", flexShrink: 0, border: selectedColor === v.color ? "2px solid #dc3545" : "1px solid #ddd", borderRadius: "8px", padding: "3px", cursor: "pointer" }}>
                                        <Image src={`https://res.cloudinary.com/kcord2gk/${v.image}`} className="w-100 h-100" style={{ objectFit: "contain" }} />
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col md={6} className="border-start">
                            <Card.Body className="p-4">
                                <Badge bg="secondary" className="mb-3">{product?.category?.name}</Badge>
                                <h2 className="fw-bold">{product?.name}</h2>
                                <h3 className="text-danger fw-bold mb-2">{Number(displayPrice || 0).toLocaleString("vi-VN")} ₫</h3>
                                {selectedVariant && <p className="text-muted mb-4">Còn <strong>{displayStock}</strong> sản phẩm</p>}
                                {hasColor && <><h6 className="fw-bold mt-4">Màu sắc</h6><div className="d-flex gap-2 mb-4 flex-wrap">{colors.map(color => {
                                    const variant = getVariantForColor(color);
                                    return <Button key={color} variant={selectedColor === color ? "dark" : "outline-dark"} disabled={!variant || variant.stock <= 0} onClick={() => selectColor(color)}>{color}</Button>;
                                })}</div></>}
                                {hasSize && <><h6 className="fw-bold">Kích thước</h6><div className="d-flex gap-2 mb-4 flex-wrap">{sizes.map(size => {
                                    const variant = getVariantForSize(size);
                                    return <Button key={size} variant={selectedSize === size ? "dark" : "outline-secondary"} disabled={!variant || variant.stock <= 0} onClick={() => selectSize(size)}>{size}</Button>;
                                })}</div></>}
                                <h6 className="fw-bold">Số lượng</h6>
                                <div className="d-flex align-items-center mb-4">
                                    <Button variant="outline-secondary" onClick={decreaseQuantity} disabled={quantity <= 1 || !selectedVariant}>−</Button>
                                    <span className="px-4" style={{ minWidth: "60px", textAlign: "center" }}>{quantity}</span>
                                    <Button variant="outline-secondary" onClick={increaseQuantity} disabled={!selectedVariant || quantity >= selectedVariant.stock}>+</Button>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-danger" size="lg" className="flex-grow-1" onClick={addToCart} disabled={addingCart || !isVariantSelected() || !selectedVariant || selectedVariant.stock <= 0}>🛒 {addingCart ? "Đang thêm..." : "Thêm vào giỏ"}</Button>
                                    <Button variant="danger" size="lg" className="flex-grow-1" onClick={buyNow} disabled={!isVariantSelected() || !selectedVariant || selectedVariant.stock <= 0}>Mua ngay</Button>
                                </div>
                            </Card.Body>
                        </Col>
                    </Row>
                </Card>
                <Card className="border-0 shadow-sm mt-4">
                    <Card.Body>
                        <h5 className="fw-bold">Mô tả sản phẩm</h5>
                        <p className="text-muted">{product?.description}</p>
                    </Card.Body>
                </Card>
                <Container className="mt-4 mb-5">
                    <Rating productId={productId} averageRating={product?.average_rating} />
                </Container>
            </Container>
        </>
    );
};

export default ProductDetail;
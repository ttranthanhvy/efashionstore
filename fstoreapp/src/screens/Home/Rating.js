import { useContext, useEffect, useState } from "react";
import { Card, Image, Pagination, Button, Form, Alert } from "react-bootstrap";
import { FaStar, FaRegStar, FaEdit, FaTrash } from "react-icons/fa";
import { MyUserContext } from "../../configs/Context";
import Apis, { endpoints } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";

const Rating = ({ productId, averageRating }) => {
    const [user] = useContext(MyUserContext);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [ratingsPage, setRatingsPage] = useState(null);
    const [rate, setRate] = useState(0);
    const [comment, setComment] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setErrorMessage("");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const showError = (message) => {
        setErrorMessage(message);
        setSuccessMessage("");
        setTimeout(() => setErrorMessage(""), 3000);
    };

    const loadRatings = async () => {
        if (!productId) return;
        try {
            setLoading(true);
            const res = await Apis.get(endpoints["ratings"](productId), { params: { page } });
            setRatings(res.data.results || []);
            setRatingsPage(res.data);
        } catch (error) {
            console.error(error);
            setRatings([]);
            setRatingsPage(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRatings();
    }, [productId, page]);

    const resetForm = () => {
        setEditingId(null);
        setRate(0);
        setComment("");
    };

    const submitRating = async () => {
        if (!user) {
            showError("Vui lòng đăng nhập để đánh giá sản phẩm!");
            return;
        }
        if (rate === 0) {
            showError("Vui lòng chọn số sao!");
            return;
        }
        try {
            await Apis.post(endpoints["secure-ratings"], { product: Number(productId), rate: Number(rate), comment: comment.trim() || null });
            showSuccess("Đánh giá thành công!");
            resetForm();
            if (page !== 1) setPage(1);
            else loadRatings();
        } catch (error) {
            showError(error.response?.data?.detail || "Không thể gửi đánh giá!");
        }
    };

    const startEdit = (rating) => {
        setEditingId(rating.id);
        setRate(Number(rating.rate));
        setComment(rating.comment || "");
    };

    const updateRating = async () => {
        if (!editingId || rate === 0) return;
        try {
            await Apis.patch(`${endpoints["secure-ratings"]}${editingId}/`, { rate: Number(rate), comment: comment.trim() || null });
            showSuccess("Cập nhật đánh giá thành công!");
            resetForm();
            loadRatings();
        } catch (error) {
            showError(error.response?.data?.detail || "Không thể cập nhật đánh giá!");
        }
    };

    const deleteRating = async (ratingId) => {
        if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
        try {
            await Apis.delete(`${endpoints["secure-ratings"]}${ratingId}/`);
            showSuccess("Xóa đánh giá thành công!");
            if (editingId === ratingId) resetForm();
            if (ratings.length === 1 && page > 1) setPage(page - 1);
            else loadRatings();
        } catch (error) {
            showError(error.response?.data?.detail || "Không thể xóa đánh giá!");
        }
    };

    const renderStars = (value, size = 16) => [1, 2, 3, 4, 5].map(star => star <= Number(value || 0) ? <FaStar key={star} className="text-warning me-1" size={size} /> : <FaRegStar key={star} className="text-warning me-1" size={size} />);

    if (loading) return <div className="text-center py-5"><MySpinner /></div>;

    return (
        <Card className="border-0 shadow-sm mt-4">
            <Card.Body className="p-0">
                {successMessage && <div className="px-4 pt-3"><Alert variant="success" dismissible onClose={() => setSuccessMessage("")}><strong>Thành công!</strong> {successMessage}</Alert></div>}
                {errorMessage && <div className="px-4 pt-3"><Alert variant="danger" dismissible onClose={() => setErrorMessage("")}><strong>Thông báo!</strong> {errorMessage}</Alert></div>}
                <div className="px-4 py-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold mb-0">Đánh giá sản phẩm</h4>
                        <div className="text-end">
                            <div className="fw-bold fs-5">{Number(averageRating || 0).toFixed(1)} / 5</div>
                            <div>{renderStars(Math.round(Number(averageRating || 0)), 16)}</div>
                            <small className="text-muted">{ratingsPage?.count || 0} đánh giá</small>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-4 border-bottom">
                    <div className="fw-semibold mb-3">{editingId ? "Chỉnh sửa đánh giá" : "Viết đánh giá của bạn"}</div>
                    <div className="d-flex align-items-center mb-3">
                        {[1, 2, 3, 4, 5].map(star => <span key={star} onClick={() => user && setRate(star)} style={{ cursor: user ? "pointer" : "default", marginRight: "5px" }}>{star <= rate ? <FaStar className="text-warning" size={24} /> : <FaRegStar className="text-warning" size={24} />}</span>)}
                    </div>
                    <Form.Control as="textarea" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder={user ? "Nhập bình luận của bạn..." : "Vui lòng đăng nhập để đánh giá sản phẩm..."} disabled={!user} />
                    <div className="mt-3 d-flex gap-2">
                        {editingId ? <><Button variant="dark" onClick={updateRating} disabled={!user || rate === 0}>Cập nhật</Button><Button variant="outline-secondary" onClick={resetForm}>Hủy</Button></> : <Button variant="dark" onClick={submitRating} disabled={!user || rate === 0}>Gửi đánh giá</Button>}
                    </div>
                </div>
                <div className="px-4 py-3"><h5 className="fw-bold mb-0">Các đánh giá của khách hàng</h5></div>
                {ratings.length === 0 ? <div className="text-center text-muted py-5">Chưa có đánh giá nào cho sản phẩm này.</div> : ratings.map(r => (
                    <div key={r.id} className="px-4 py-4 border-top">
                        <div className="d-flex">
                            <div className="me-3">
                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f1f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {r.customer_avatar ? <Image src={`https://res.cloudinary.com/kcord2gk/${r.customer_avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="text-secondary fw-bold">{r.customer_username?.charAt(0).toUpperCase() || "K"}</span>}
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-semibold">{r.customer_username || "Khách hàng"}</span>
                                    <div>{renderStars(r.rate, 16)}</div>
                                </div>
                                <div className="text-dark mt-1" style={{ fontSize: "15px", lineHeight: "1.6" }}>{r.comment}</div>
                                <div className="text-muted mt-1" style={{ fontSize: "13px" }}>{new Date(r.created_date).toLocaleDateString("vi-VN")}</div>
                                {user && Number(r.user_id) === Number(user.id) && <div className="mt-2 d-flex gap-2"><Button variant="outline-primary" size="sm" onClick={() => startEdit(r)}><FaEdit className="me-1" />Sửa</Button><Button variant="outline-danger" size="sm" onClick={() => deleteRating(r.id)}><FaTrash className="me-1" />Xóa</Button></div>}
                            </div>
                        </div>
                    </div>
                ))}
                {ratingsPage?.count > 0 && <div className="d-flex justify-content-center py-3 border-top"><Pagination className="mb-0"><Pagination.Prev disabled={!ratingsPage.previous} onClick={() => ratingsPage.previous && setPage(page - 1)} /><Pagination.Item active>{page}</Pagination.Item><Pagination.Next disabled={!ratingsPage.next} onClick={() => ratingsPage.next && setPage(page + 1)} /></Pagination></div>}
            </Card.Body>
        </Card>
    );
};

export default Rating;
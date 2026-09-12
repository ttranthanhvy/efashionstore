import { useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Apis, { endpoints } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";
import loginImg from "../../assets/Login-pic.png";

const Register = () => {
    const [user, setUser] = useState({ firstName: "", lastName: "", email: "", username: "", password: "", avatar: null });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const updateField = (field, value) => setUser({ ...user, [field]: value });

    const handleAvatarChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        setUser({ ...user, avatar: file });
        setAvatarPreview(URL.createObjectURL(file));
    };

    const validate = () => {
        if (!user.firstName.trim()) {
            setErr("Vui lòng nhập họ.");
            return false;
        }
        if (!user.lastName.trim()) {
            setErr("Vui lòng nhập tên.");
            return false;
        }
        if (!user.email.trim()) {
            setErr("Vui lòng nhập email.");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
            setErr("Email không hợp lệ.");
            return false;
        }
        if (!user.username.trim()) {
            setErr("Vui lòng nhập tên đăng nhập.");
            return false;
        }
        if (user.username.trim().length < 3 || user.username.trim().length > 50) {
            setErr("Tên đăng nhập phải từ 3 đến 50 ký tự.");
            return false;
        }
        if (!user.password.trim()) {
            setErr("Vui lòng nhập mật khẩu.");
            return false;
        }
        if (user.password.length < 6) {
            setErr("Mật khẩu phải có ít nhất 6 ký tự.");
            return false;
        }
        if (user.avatar) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(user.avatar.type)) {
                setErr("Avatar chỉ hỗ trợ JPG, PNG hoặc WEBP.");
                return false;
            }
            if (user.avatar.size > 5 * 1024 * 1024) {
                setErr("Avatar không được lớn hơn 5MB.");
                return false;
            }
        }
        return true;
    };

    const getErrorMessage = ex => {
        if (!ex.response) return "Không thể kết nối đến server.";
        const data = ex.response.data;
        if (typeof data === "string") return data;
        if (Array.isArray(data)) return data.map(item => item.defaultMessage || item.message || "Dữ liệu không hợp lệ.").join(" ");
        if (data?.message) return data.message;
        if (data && typeof data === "object") return Object.values(data).flat().join(" ");
        return "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
    };

    const register = async e => {
        e.preventDefault();
        setErr("");
        setSuccess("");
        if (!validate()) return;
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("first_name", user.firstName);
            formData.append("last_name", user.lastName);
            formData.append("email", user.email);
            formData.append("username", user.username);
            formData.append("password", user.password);
            if (user.avatar) formData.append("avatar", user.avatar);
            await Apis.post(endpoints.register, formData);
            setSuccess("Đăng ký thành công. Vui lòng đăng nhập.");
            setTimeout(() => nav("/login"), 1000);
        } catch (ex) {
            console.error(ex);
            setErr(getErrorMessage(ex));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row className="justify-content-center align-items-stretch app-page">
            <Col xs={12} md={5} lg={5} xl={4} className="d-flex">
                <div className="login-image w-100"><img src={loginImg} alt="Fashion Store" /></div>
            </Col>
            <Col xs={12} sm={10} md={5} lg={5} xl={4} className="d-flex">
                <Card className="auth-card shadow-sm w-100">
                    <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4"><h2 className="fw-bold login-title">Đăng ký</h2></div>
                        {err && <Alert variant="danger">{err}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={register}>
                            <div className="text-center mb-4">
                                <div className="mb-3">{avatarPreview ? <Image src={avatarPreview} roundedCircle width={110} height={110} style={{ objectFit: "cover" }} /> : <div className="avatar-placeholder d-flex justify-content-center align-items-center mx-auto" style={{ width: "110px", height: "110px", borderRadius: "50%" }}><FaUser size={45} /></div>}</div>
                                <div className="avatar-upload"><Button variant="outline-primary" as="label" htmlFor="avatar">Chọn ảnh đại diện</Button></div>
                                <Form.Control id="avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} disabled={loading} className="d-none" />
                                <div className="small text-muted mt-2">JPG, PNG hoặc WEBP · tối đa 5MB</div>
                            </div>
                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ</Form.Label><Form.Control type="text" placeholder="Nhập họ" value={user.firstName} onChange={e => updateField("firstName", e.target.value)} disabled={loading} /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>Tên</Form.Label><Form.Control type="text" placeholder="Nhập tên" value={user.lastName} onChange={e => updateField("lastName", e.target.value)} disabled={loading} /></Form.Group></Col>
                            </Row>
                            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" placeholder="Nhập email" value={user.email} onChange={e => updateField("email", e.target.value)} disabled={loading} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Tên đăng nhập</Form.Label><Form.Control type="text" placeholder="Nhập tên đăng nhập" value={user.username} onChange={e => updateField("username", e.target.value)} disabled={loading} /></Form.Group>
                            <Form.Group className="mb-4"><Form.Label>Mật khẩu</Form.Label><Form.Control type="password" placeholder="Nhập mật khẩu" value={user.password} onChange={e => updateField("password", e.target.value)} disabled={loading} /></Form.Group>
                            <div className="d-grid"><Button type="submit" className="login-button" disabled={loading}>{loading ? <><MySpinner />Đang đăng ký...</> : "ĐĂNG KÝ"}</Button></div>
                        </Form>
                        <div className="text-center mt-4"><span className="text-muted">Đã có tài khoản?</span><Link to="/login" className="ms-2 login-link fw-bold">Đăng nhập</Link></div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default Register;
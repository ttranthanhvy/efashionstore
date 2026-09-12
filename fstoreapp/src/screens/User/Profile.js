import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Image, Modal, Row } from "react-bootstrap";
import { FaEdit, FaUser } from "react-icons/fa";
import Apis, { endpoints } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";
import { MyUserContext } from "../../configs/Context";
import { staffColors } from "../Staff/StaffStyle";

const pink = "#F7C8D3";
const dark = "#2D3A47";
const customerBackground = "#FFF8E8";

const Profile = () => {
    const [user] = useContext(MyUserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState("");
    const [message, setMessage] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "" });

    const role = profile?.role || user?.role || "CUSTOMER";
    const isCustomer = role === "CUSTOMER";
    const mainColor = isCustomer ? pink : staffColors.midnightLagoon;
    const background = isCustomer ? customerBackground : staffColors.background;
    const iconBackground = isCustomer ? "#FFFFFF" : "#A9B7C6";
    const buttonColor = isCustomer ? pink : staffColors.mistySky;
    const buttonText = isCustomer ? dark : staffColors.midnightLagoon;

    const loadProfile = async () => {
        try {
            setLoading(true);
            setErr("");
            const res = await Apis.get(endpoints.profile);
            setProfile(res.data);
            setForm({
                username: res.data.username || "",
                first_name: res.data.first_name || "",
                last_name: res.data.last_name || "",
                email: res.data.email || ""
            });
        } catch (error) {
            setErr(error.response?.data?.detail || "Không thể tải thông tin tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const getImageUrl = image => {
        if (!image) return null;
        if (image.startsWith("http")) return image;
        return `https://res.cloudinary.com/kcord2gk/${image}`;
    };

    const getInitials = () => {
        const first = profile?.first_name?.charAt(0) || "";
        const last = profile?.last_name?.charAt(0) || "";
        return `${first}${last}`.toUpperCase() || "U";
    };

    const openEdit = () => {
        setForm({
            username: profile?.username || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            email: profile?.email || ""
        });
        setErr("");
        setShowEdit(true);
    };

    const saveProfile = async e => {
        e.preventDefault();

        if (!form.username.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
            setErr("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        try {
            setSaving(true);
            setErr("");

            await Apis.patch(endpoints.profile, {
                username: form.username.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim()
            });

            setShowEdit(false);
            await loadProfile();
            setMessage("Cập nhật thông tin thành công.");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            const data = error.response?.data;
            setErr(data?.detail || Object.values(data || {}).flat().join(", ") || "Không thể cập nhật thông tin.");
        } finally {
            setSaving(false);
        }
    };

    const uploadAvatar = async e => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErr("Vui lòng chọn file hình ảnh.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErr("Ảnh không được vượt quá 5MB.");
            return;
        }

        try {
            setUploading(true);
            setErr("");

            const data = new FormData();
            data.append("avatar", file);

            await Apis.patch(endpoints.profile, data, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            await loadProfile();
            setMessage("Đổi ảnh đại diện thành công.");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            const data = error.response?.data;
            setErr(data?.detail || Object.values(data || {}).flat().join(", ") || "Không thể đổi ảnh đại diện.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <MySpinner />
            </Container>
        );
    }

    return (
        <>
            <div style={{ minHeight: "100vh", backgroundColor: background, padding: "30px 0" }}>
                <Container>
                    <Card className="border-0 mb-4" style={{ backgroundColor: mainColor, borderRadius: "16px", boxShadow: isCustomer ? "0 8px 25px rgba(247,200,211,.3)" : "0 8px 25px rgba(45,58,71,.15)" }}>
                        <Card.Body className="d-flex align-items-center p-4 px-md-5">
                            <div className="d-flex align-items-center justify-content-center me-3" style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: iconBackground, color: dark, fontSize: "22px" }}>
                                <FaUser />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1" style={{ color: isCustomer ? dark : "#FFFFFF" }}>Tài khoản</h2>
                                <p className="mb-0" style={{ color: isCustomer ? dark : "#FFFFFF" }}>Thông tin tài khoản của bạn</p>
                            </div>
                        </Card.Body>
                    </Card>

                    {err && <Alert variant="danger">{err}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}

                    {profile && (
                        <Card className="border-0" style={{ borderRadius: "16px", boxShadow: "0 6px 20px rgba(45,58,71,.08)" }}>
                            <Card.Body className="p-4 p-md-5">
                                <Row className="align-items-center">
                                    <Col md={4} className="text-center mb-4 mb-md-0">
                                        {getImageUrl(profile.avatar) ? (
                                            <Image src={getImageUrl(profile.avatar)} roundedCircle style={{ width: "170px", height: "170px", objectFit: "cover", border: `5px solid ${isCustomer ? pink : staffColors.mistySky}` }} />
                                        ) : (
                                            <div className="mx-auto d-flex align-items-center justify-content-center" style={{ width: "170px", height: "170px", borderRadius: "50%", backgroundColor: isCustomer ? pink : staffColors.mistySky, color: dark, fontSize: "48px", fontWeight: "700" }}>
                                                {getInitials()}
                                            </div>
                                        )}

                                        <h4 className="fw-bold mt-4 mb-1" style={{ color: dark }}>
                                            {profile.first_name} {profile.last_name}
                                        </h4>

                                        <p className="text-muted mb-3">@{profile.username}</p>

                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />

                                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ backgroundColor: buttonColor, border: "none", color: buttonText, borderRadius: "9px", padding: "8px 16px" }}>
                                            {uploading ? "Đang tải..." : "Đổi ảnh"}
                                        </Button>
                                    </Col>

                                    <Col md={8}>
                                        <div style={{ maxWidth: "520px" }}>
                                            <h5 className="fw-bold mb-4" style={{ color: dark }}>Thông tin cá nhân</h5>

                                            <Row className="gy-3">
                                                <Col xs={4} className="text-muted">Họ</Col>
                                                <Col xs={8}><strong>{profile.first_name || "Chưa cập nhật"}</strong></Col>

                                                <Col xs={4} className="text-muted">Tên</Col>
                                                <Col xs={8}><strong>{profile.last_name || "Chưa cập nhật"}</strong></Col>

                                                <Col xs={4} className="text-muted">Username</Col>
                                                <Col xs={8}><strong>{profile.username}</strong></Col>

                                                <Col xs={4} className="text-muted">Email</Col>
                                                <Col xs={8}><strong>{profile.email || "Chưa cập nhật"}</strong></Col>

                                                <Col xs={4} className="text-muted">ID</Col>
                                                <Col xs={8}><strong>#{profile.id}</strong></Col>

                                                <Col xs={4} className="text-muted">Vai trò</Col>
                                                <Col xs={8}><strong>{role}</strong></Col>
                                            </Row>

                                            <Button className="mt-4" onClick={openEdit} style={{ backgroundColor: buttonColor, border: "none", color: buttonText, borderRadius: "9px", padding: "8px 16px" }}>
                                                <FaEdit className="me-2" />Chỉnh sửa
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </div>

            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: mainColor, border: "none" }}>
                    <Modal.Title style={{ color: isCustomer ? dark : "#FFFFFF", fontWeight: "700" }}>Chỉnh sửa thông tin</Modal.Title>
                </Modal.Header>

                <Form onSubmit={saveProfile}>
                    <Modal.Body className="p-4">
                        {err && <Alert variant="danger">{err}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Họ</Form.Label>
                            <Form.Control value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tên</Form.Label>
                            <Form.Control value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowEdit(false)}>Hủy</Button>
                        <Button type="submit" disabled={saving} style={{ backgroundColor: buttonColor, border: "none", color: buttonText, borderRadius: "9px" }}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Profile;
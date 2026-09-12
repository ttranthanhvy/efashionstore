import { useContext, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import cookies from "react-cookies";
import Apis, { endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Context";
import MySpinner from "../../components/MySpinner";
import loginImg from "../../assets/Login-pic.png";

const Login = () => {
    const [user, setUser] = useState({ username: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [, dispatch] = useContext(MyUserContext);
    const [q] = useSearchParams();
    const nav = useNavigate();

    const updateField = (field, value) => {
        setUser({ ...user, [field]: value });
    };

    const validate = () => {
        if (!user.username.trim()) {
            setErr("Vui lòng nhập tên đăng nhập.");
            return false;
        }
        if (!user.password.trim()) {
            setErr("Vui lòng nhập mật khẩu.");
            return false;
        }
        return true;
    };

    const login = async e => {
        e.preventDefault();
        setErr("");
        if (!validate()) return;

        try {
            setLoading(true);

            const res = await Apis.post(endpoints.login, {
                username: user.username,
                password: user.password
            });

            const loginUser = {
                id: res.data.user.id,
                username: res.data.user.username,
                role: res.data.user.role
            };

            cookies.save("user", loginUser, { path: "/" });
            cookies.save("access_token", res.data.access, { path: "/" });
            cookies.save("refresh_token", res.data.refresh, { path: "/" });

            dispatch({
                type: "LOGIN",
                payload: loginUser
            });

            const next = q.get("next");

            if (next) {
                nav(next);
            } else if (loginUser.role === "STAFF" || loginUser.role === "ADMIN") {
                nav("/staff/products");
            } else {
                nav("/home");
            }
        } catch (ex) {
            console.error(ex);

            if (ex.response?.status === 401) {
                setErr("Sai tên đăng nhập, mật khẩu hoặc tài khoản chưa được duyệt.");
            } else if (ex.response?.data?.detail) {
                setErr(ex.response.data.detail);
            } else {
                setErr("Không thể kết nối đến server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row className="justify-content-center align-items-center login-page">
            <Col xs={12} md={5} lg={5} xl={4}>
                <div className="login-image">
                    <img src={loginImg} alt="Fashion Store" />
                </div>
            </Col>

            <Col xs={12} sm={10} md={5} lg={5} xl={4}>
                <Card className="login-card border-0 shadow-sm rounded-4">
                    <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold login-title">Fashion Store</h2>
                            <p className="text-muted mb-0">Chào mừng bạn quay trở lại</p>
                        </div>

                        {err && <Alert variant="danger">{err}</Alert>}

                        <Form onSubmit={login}>
                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label className="fw-semibold">Tên đăng nhập</Form.Label>
                                <Form.Control type="text" placeholder="Nhập tên đăng nhập" value={user.username} onChange={e => updateField("username", e.target.value)} disabled={loading} />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label className="fw-semibold">Mật khẩu</Form.Label>
                                <Form.Control type="password" placeholder="Nhập mật khẩu" value={user.password} onChange={e => updateField("password", e.target.value)} disabled={loading} />
                            </Form.Group>

                            <div className="d-grid">
                                <Button type="submit" className="login-button" disabled={loading}>
                                    {loading ? <><MySpinner /> Đang đăng nhập...</> : "ĐĂNG NHẬP"}
                                </Button>
                            </div>
                        </Form>

                        <div className="text-center mt-4">
                            <span className="text-muted">Chưa có tài khoản?</span>
                            <Link to="/register" className="ms-2 login-link fw-bold">Đăng ký</Link>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default Login;
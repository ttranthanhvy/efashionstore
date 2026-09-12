import { useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import Apis, { endpoints } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";

const ChangePassword = () => {
    const [password, setPassword] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const nav = useNavigate();

    const updateField = (field, value) => {
        setPassword({
            ...password,
            [field]: value
        });
    };

    const validate = () => {
        if (!password.oldPassword.trim()) {
            setErr("Vui lòng nhập mật khẩu cũ.");
            return false;
        }

        if (!password.newPassword.trim()) {
            setErr("Vui lòng nhập mật khẩu mới.");
            return false;
        }

        if (password.newPassword.length < 6) {
            setErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return false;
        }

        if (!password.confirmPassword.trim()) {
            setErr("Vui lòng nhập lại mật khẩu mới.");
            return false;
        }

        if (password.newPassword !== password.confirmPassword) {
            setErr("Mật khẩu mới và nhập lại mật khẩu không khớp.");
            return false;
        }

        return true;
    };

    const getErrorMessage = (ex) => {
        if (!ex.response) {
            return "Không thể kết nối đến server.";
        }

        const status = ex.response.status;
        const data = ex.response.data;

        if (status === 400) {
            if (Array.isArray(data)) {
                return data
                    .map(item => item.defaultMessage || item.message || "Dữ liệu không hợp lệ.")
                    .join(" ");
            }

            return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        }

        if (status === 401) {
            return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        }

        if (status === 422) {
            if (typeof data === "string") {
                return data;
            }

            if (data && data.message) {
                return data.message;
            }

            return "Mật khẩu cũ không đúng hoặc mật khẩu xác nhận không hợp lệ.";
        }

        if (typeof data === "string") {
            return data;
        }

        if (data && data.message) {
            return data.message;
        }

        return "Đổi mật khẩu thất bại. Vui lòng thử lại.";
    };

    const changePassword = async (e) => {
        e.preventDefault();

        setErr("");
        setSuccess("");

        if (!validate()) {
            return;
        }

        try {
            setLoading(true);

            await Apis.patch(endpoints.changePassword, {
                oldPassword: password.oldPassword,
                newPassword: password.newPassword,
                confirmPassword: password.confirmPassword
            });

            setSuccess("Đổi mật khẩu thành công.");

            setPassword({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (ex) {
            console.error(ex);
            setErr(getErrorMessage(ex));

        } finally {
            setLoading(false);
        }
    };

    const cancel = () => {
        nav("/me");
    };

    return (
        <Row className="justify-content-center app-page">
            <Col xs={12} sm={10} md={7} lg={5} xl={4}>
                <Card className="auth-card shadow-sm">

                    <Card.Body className="p-4 p-md-5">

                        <div className="text-center mb-4">
                            <h2 className="auth-title">
                                Đổi mật khẩu
                            </h2>

                            <p className="text-muted mb-0">
                                Cập nhật mật khẩu tài khoản
                            </p>
                        </div>

                        {err && (
                            <Alert variant="danger">
                                {err}
                            </Alert>
                        )}

                        {success && (
                            <Alert variant="success">
                                {success}
                            </Alert>
                        )}

                        <Form onSubmit={changePassword}>

                            <Form.Group
                                className="mb-3"
                                controlId="oldPassword"
                            >
                                <Form.Label>
                                    Mật khẩu cũ
                                </Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Nhập mật khẩu cũ"
                                    value={password.oldPassword}
                                    onChange={(e) =>
                                        updateField(
                                            "oldPassword",
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    required
                                />
                            </Form.Group>

                            <Form.Group
                                className="mb-3"
                                controlId="newPassword"
                            >
                                <Form.Label>
                                    Mật khẩu mới
                                </Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Nhập mật khẩu mới"
                                    value={password.newPassword}
                                    onChange={(e) =>
                                        updateField(
                                            "newPassword",
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    required
                                />

                                <Form.Text className="text-muted">
                                    Mật khẩu mới phải có ít nhất 6 ký tự.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group
                                className="mb-4"
                                controlId="confirmPassword"
                            >
                                <Form.Label>
                                    Nhập lại mật khẩu
                                </Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={password.confirmPassword}
                                    onChange={(e) =>
                                        updateField(
                                            "confirmPassword",
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                    required
                                />
                            </Form.Group>

                            <div className="d-flex gap-2">
                                <Button
                                    type="button"
                                    className="secondary-button flex-fill"
                                    onClick={cancel}
                                    disabled={loading}
                                >
                                    Hủy
                                </Button>

                                <Button
                                    type="submit"
                                    className="main-button flex-fill"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <MySpinner />
                                            Đang xác nhận...
                                        </>
                                    ) : (
                                        "XÁC NHẬN"
                                    )}
                                </Button>
                            </div>

                        </Form>

                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ChangePassword;
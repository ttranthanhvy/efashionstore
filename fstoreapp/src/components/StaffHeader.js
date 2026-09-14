import { useContext, useState } from "react";
import { Container, Nav, Navbar, Dropdown, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUser } from "react-icons/fa";
import cookies from "react-cookies";
import { MyUserContext } from "../configs/Context";
import { staffColors } from "../screens/Staff/StaffStyle";

const StaffHeader = () => {
    const nav = useNavigate();
    const [user, dispatch] = useContext(MyUserContext);
    const [kw, setKw] = useState("");
    const [hover, setHover] = useState("");

    const search = e => {
        e.preventDefault();
        if (!kw.trim()) return;
        nav(`/staff?kw=${kw.trim()}`);
    };

    const logout = () => {
        cookies.remove("user", { path: "/" });
        cookies.remove("access_token", { path: "/" });
        cookies.remove("refresh_token", { path: "/" });
        dispatch({ type: "LOGOUT" });
        nav("/login");
    };

    const linkStyle = active => ({
        color: hover === active ? staffColors.midnightLagoon : "#52616D",
        fontSize: "13px",
        fontWeight: "600",
        textDecoration: "none",
        transition: "all .2s ease",
        transform: hover === active ? "translateY(-1px)" : "translateY(0)"
    });

    return (
        <Navbar expand="lg" className="border-bottom" style={{ backgroundColor: staffColors.mistySky, minHeight: "64px", boxShadow: "0 2px 10px rgba(45,58,71,.08)" }}>
            <Container fluid className="px-4 px-lg-5">
                <Navbar.Brand as={Link} to="/staff" className="fw-bold d-flex align-items-center" style={{ color: staffColors.midnightLagoon, fontSize: "20px", minWidth: "175px" }}>
                    <span className="me-2 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: staffColors.midnightLagoon, color: staffColors.mistySky, fontWeight: "800", boxShadow: "0 3px 8px rgba(45,58,71,.2)" }}>F</span>
                    Fashion Store
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="staff-navbar" style={{ borderColor: staffColors.midnightLagoon }} />

                <Navbar.Collapse id="staff-navbar">
                    <Nav className="mx-auto align-items-lg-center">
                        <Nav.Link as={Link} to="/staff/orders" className="px-3 fw-bold" style={linkStyle("orders")} onMouseEnter={() => setHover("orders")} onMouseLeave={() => setHover("")}>
                            Đơn hàng
                        </Nav.Link>
                        <Nav.Link as={Link} to="/staff/products" className="px-3 fw-bold" style={linkStyle("products")} onMouseEnter={() => setHover("products")} onMouseLeave={() => setHover("")}>
                            Sản phẩm
                        </Nav.Link>
                        <Nav.Link as={Link} to="/staff/discounts" className="px-3 fw-bold" style={linkStyle("discounts")} onMouseEnter={() => setHover("discounts")} onMouseLeave={() => setHover("")}>
                            Khuyến mãi
                        </Nav.Link>
                        <Nav.Link as={Link} to="/staff/inventory" className="px-3 fw-bold" style={linkStyle("inventory")} onMouseEnter={() => setHover("inventory")} onMouseLeave={() => setHover("")}>
                            Kho hàng
                        </Nav.Link>
                    </Nav>

                    <Nav className="align-items-center gap-2">
                        <Form onSubmit={search} className="d-none d-xl-flex align-items-center" style={{ width: "190px", height: "36px", backgroundColor: staffColors.white, borderRadius: "20px", padding: "0 13px", boxShadow: "0 3px 10px rgba(45,58,71,.08)", border: `1px solid ${staffColors.border}` }}>
                            <Form.Control type="text" placeholder="Tìm sản phẩm" className="border-0 bg-transparent shadow-none p-0" style={{ fontSize: "11px", color: staffColors.midnightLagoon }} value={kw} onChange={e => setKw(e.target.value)} />
                            <Button type="submit" variant="link" className="border-0 p-0" style={{ color: staffColors.midnightLagoon }}>
                                <FaSearch size={14} />
                            </Button>
                        </Form>

                        <Dropdown>
                            <Dropdown.Toggle variant="link" className="border-0 d-flex align-items-center gap-2 p-2" style={{ color: staffColors.midnightLagoon, textDecoration: "none", fontSize: "13px" }}>
                                {user ? (
                                    <>
                                        {user.avatar ? <img src={user.avatar} alt={user.username} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${staffColors.white}` }} /> : <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: "32px", height: "32px", backgroundColor: staffColors.midnightLagoon, color: staffColors.mistySky }}><FaUser size={13} /></div>}
                                        <span className="fw-semibold">{user.username}</span>
                                    </>
                                ) : (
                                    <>
                                        <FaUser size={14} />
                                        <span>Tài khoản</span>
                                    </>
                                )}
                            </Dropdown.Toggle>

                            <Dropdown.Menu align="end" className="border-0 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
                                <Dropdown.Item as={Link} to="/profile" style={{ color: staffColors.midnightLagoon, fontSize: "13px" }}>
                                    Tài khoản
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={logout} className="text-danger" style={{ fontSize: "13px" }}>
                                    Đăng xuất
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default StaffHeader;
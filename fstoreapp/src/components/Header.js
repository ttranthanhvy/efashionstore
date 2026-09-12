import { useContext, useEffect, useState } from "react";
import { Alert, Container, Nav, Navbar, Dropdown, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaShoppingBag, FaUser } from "react-icons/fa";
import Apis, { endpoints } from "../configs/Apis";
import { MyUserContext } from "../configs/Context";
import cookies from "react-cookies";
import StaffHeader from "./StaffHeader";

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [kw, setKw] = useState("");
    const [alert, setAlert] = useState("");
    const nav = useNavigate();
    const [user, dispatch] = useContext(MyUserContext);

    useEffect(() => {
        const loadCates = async () => {
            try {
                const res = await Apis.get(endpoints.categories);
                setCategories(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        loadCates();
    }, []);

    const search = e => {
        e.preventDefault();
        if (!kw.trim()) return;
        nav(`/home?kw=${encodeURIComponent(kw.trim())}`);
    };

    const getChildren = parentId => categories.filter(c => c.parent_id === parentId);
    const nam = categories.find(c => c.parent_id === null && c.name.toLowerCase() === "nam");
    const nu = categories.find(c => c.parent_id === null && c.name.toLowerCase() === "nữ");

    const goToCart = () => {
        if (!user) {
            setAlert("Vui lòng đăng nhập để xem giỏ hàng.");
            setTimeout(() => setAlert(""), 3000);
            return;
        }
        nav("/cart");
    };

    const logout = () => {
        cookies.remove("user", { path: "/" });
        cookies.remove("access_token", { path: "/" });
        cookies.remove("refresh_token", { path: "/" });
        dispatch({ type: "LOGOUT" });
        nav("/login");
    };

    if (user && (user.role === "STAFF" || user.role === "ADMIN")) return <StaffHeader />;

    return (
        <>
            {alert && <Alert variant="warning" className="position-fixed top-0 start-50 translate-middle-x mt-3 shadow-sm" style={{ zIndex: 9999, borderRadius: "10px" }}>{alert}</Alert>}
            <Navbar expand="lg" className="header border-bottom" style={{ backgroundColor: "#F7C8D3", minHeight: "64px" }}>
                <Container fluid className="px-4 px-lg-5">
                    <Navbar.Brand as={Link} to="/home" className="fw-bold d-flex align-items-center" style={{ color: "#5c3038", fontSize: "21px", minWidth: "160px" }}>
                        <span className="me-2 d-flex align-items-center justify-content-center" style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#fff", color: "#B46472", fontWeight: "800" }}>F</span>
                        Fashion Store
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="fashion-navbar" />
                    <Navbar.Collapse id="fashion-navbar">
                        <Nav className="mx-auto align-items-lg-center">
                            <Nav.Link as={Link} to="/home" className="px-3 fw-bold" style={{ color: "#5c3038", fontSize: "13px" }}>Trang chủ</Nav.Link>
                            {nam && <Dropdown className="px-2">
                                <Dropdown.Toggle variant="link" className="border-0 fw-bold p-2" style={{ color: "#5c3038", textDecoration: "none", fontSize: "13px" }}>Nam</Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to={`/home?parent_category=${nam.id}`}>Tất cả</Dropdown.Item>
                                    <Dropdown.Divider />
                                    {getChildren(nam.id).map(c => <Dropdown.Item key={c.id} as={Link} to={`/home?category=${c.id}`}>{c.name}</Dropdown.Item>)}
                                </Dropdown.Menu>
                            </Dropdown>}
                            {nu && <Dropdown className="px-2">
                                <Dropdown.Toggle variant="link" className="border-0 fw-bold p-2" style={{ color: "#5c3038", textDecoration: "none", fontSize: "13px" }}>Nữ</Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to={`/home?parent_category=${nu.id}`}>Tất cả</Dropdown.Item>
                                    <Dropdown.Divider />
                                    {getChildren(nu.id).map(c => <Dropdown.Item key={c.id} as={Link} to={`/home?category=${c.id}`}>{c.name}</Dropdown.Item>)}
                                </Dropdown.Menu>
                            </Dropdown>}
                            <Nav.Link as={Link} to="/contact" className="px-3 fw-bold" style={{ color: "#5c3038", fontSize: "13px" }}>Về chúng tôi</Nav.Link>
                        </Nav>
                        <Nav className="align-items-center gap-2">
                            <Form onSubmit={search} className="d-none d-xl-flex align-items-center" style={{ width: "180px", height: "36px", backgroundColor: "#fff", borderRadius: "20px", padding: "0 13px" }}>
                                <Form.Control type="text" placeholder="Tìm sản phẩm" className="border-0 bg-transparent shadow-none p-0" style={{ fontSize: "11px" }} value={kw} onChange={e => setKw(e.target.value)} />
                                <Button type="submit" variant="link" className="border-0 p-0" style={{ color: "#5c3038" }}><FaSearch size={15} /></Button>
                            </Form>
                            <Dropdown>
                                <Dropdown.Toggle variant="link" className="border-0 d-flex align-items-center gap-2 p-2" style={{ color: "#5c3038", textDecoration: "none", fontSize: "13px" }}>
                                    {user ? <>{user.avatar ? <img src={user.avatar} alt={user.username} style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} /> : <FaUser size={14} />}<span className="fw-semibold">{user.username}</span></> : <><FaUser size={14} /><span>Tài khoản</span></>}
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end">
                                    {user ? <><Dropdown.Item as={Link} to="/profile">Tài khoản</Dropdown.Item><Dropdown.Item as={Link} to="/orders">Đơn mua</Dropdown.Item><Dropdown.Divider /><Dropdown.Item onClick={logout} className="text-danger">Đăng xuất</Dropdown.Item></> : <><Dropdown.Item as={Link} to="/login">Đăng nhập</Dropdown.Item><Dropdown.Item as={Link} to="/register">Đăng ký</Dropdown.Item></>}
                                </Dropdown.Menu>
                            </Dropdown>
                            <Nav.Link onClick={goToCart} className="d-flex align-items-center gap-1 p-2" style={{ color: "#5c3038", fontSize: "13px", cursor: "pointer" }}>
                                <FaShoppingBag size={15} />
                                <span>Giỏ hàng</span>
                            </Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    );
};

export default Header;
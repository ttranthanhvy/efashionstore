import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Table } from "react-bootstrap";
import Apis, { endpoints } from "../../configs/Apis";
import { staffColors } from "./StaffStyle";

const StaffDiscount = () => {
    const [discounts, setDiscounts] = useState([]);
    const [show, setShow] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        code: "",
        value: "",
        min_order_value: "",
        max_discount: "",
        usage_limit: "",
        start_date: "",
        end_date: "",
        is_active: true
    });

    const loadDiscounts = async () => {
        try {
            const res = await Apis.get(endpoints["staff-discounts"]);
            setDiscounts(res.data);
        } catch (e) {
            setError("Không thể tải danh sách mã giảm giá.");
        }
    };

    useEffect(() => {
        loadDiscounts();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const openAdd = () => {
        setEditing(null);
        setForm({
            code: "",
            value: "",
            min_order_value: "",
            max_discount: "",
            usage_limit: "",
            start_date: "",
            end_date: "",
            is_active: true
        });
        setError("");
        setShow(true);
    };

    const openEdit = (discount) => {
        setEditing(discount);
        setForm({
            code: discount.code || "",
            value: discount.value || "",
            min_order_value: discount.min_order_value || "",
            max_discount: discount.max_discount || "",
            usage_limit: discount.usage_limit || "",
            start_date: discount.start_date ? discount.start_date.slice(0, 16) : "",
            end_date: discount.end_date ? discount.end_date.slice(0, 16) : "",
            is_active: discount.is_active
        });
        setError("");
        setShow(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const data = {
            code: form.code,
            value: Number(form.value),
            min_order_value: Number(form.min_order_value || 0),
            max_discount: form.max_discount ? Number(form.max_discount) : null,
            usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
            start_date: new Date(form.start_date).toISOString(),
            end_date: new Date(form.end_date).toISOString(),
            is_active: form.is_active
        };

        try {
            if (editing)
                await Apis.patch(endpoints["staff-discount"](editing.id), data);
            else
                await Apis.post(endpoints["staff-discounts"], data);

            setShow(false);
            loadDiscounts();
        } catch (e) {
            setError(e.response?.data ? Object.values(e.response.data).flat().join(" ") : "Không thể lưu mã giảm giá.");
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Bạn có chắc muốn vô hiệu hóa mã giảm giá này không?"))
            return;

        try {
            await Apis.delete(endpoints["staff-discount"](id));
            loadDiscounts();
        } catch (e) {
            setError("Không thể vô hiệu hóa mã giảm giá.");
        }
    };

    const formatMoney = (value) => `${Number(value).toLocaleString("vi-VN")} VNĐ`;
    const formatDate = (value) => new Date(value).toLocaleString("vi-VN");

    return (
        <div style={{ backgroundColor: staffColors.background, minHeight: "100vh", padding: "30px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 style={{ color: staffColors.text, fontWeight: "600" }}>Khuyến mãi</h3>
                    <p style={{ color: staffColors.muted, marginBottom: 0 }}>Quản lý mã giảm giá và chương trình khuyến mãi</p>
                </div>
                <Button style={{ backgroundColor: staffColors.midnightLagoon, border: "none" }} onClick={openAdd}>
                    + Thêm mã giảm giá
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

            <div style={{ backgroundColor: staffColors.white, borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <Table responsive hover className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Mã giảm giá</th>
                            <th>Giảm</th>
                            <th>Đơn tối thiểu</th>
                            <th>Giảm tối đa</th>
                            <th>Lượt sử dụng</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {discounts.length > 0 ? discounts.map((discount) => (
                            <tr key={discount.id}>
                                <td style={{ fontWeight: "600" }}>{discount.code}</td>
                                <td>{discount.value}%</td>
                                <td>{formatMoney(discount.min_order_value)}</td>
                                <td>{discount.max_discount ? formatMoney(discount.max_discount) : "Không giới hạn"}</td>
                                <td>{discount.used_count}/{discount.usage_limit ?? "∞"}</td>
                                <td>{formatDate(discount.start_date)}</td>
                                <td>{formatDate(discount.end_date)}</td>
                                <td>
                                    <span style={{ color: discount.is_active ? "green" : "red", fontWeight: "600" }}>
                                        {discount.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button size="sm" variant="outline-secondary" onClick={() => openEdit(discount)}>
                                            Sửa
                                        </Button>
                                        {discount.is_active && (
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDeactivate(discount.id)}>
                                                Vô hiệu hóa
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="9" className="text-center py-4" style={{ color: staffColors.muted }}>
                                    Chưa có mã giảm giá nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal show={show} onHide={() => setShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã giảm giá</Form.Label>
                            <Form.Control name="code" value={form.code} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Phần trăm giảm (%)</Form.Label>
                            <Form.Control type="number" name="value" min="0.01" max="100" step="0.01" value={form.value} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Giá trị đơn hàng tối thiểu</Form.Label>
                            <Form.Control type="number" name="min_order_value" min="0" value={form.min_order_value} onChange={handleChange} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Số tiền giảm tối đa</Form.Label>
                            <Form.Control type="number" name="max_discount" min="0" value={form.max_discount} onChange={handleChange} placeholder="Để trống nếu không giới hạn" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Giới hạn lượt sử dụng</Form.Label>
                            <Form.Control type="number" name="usage_limit" min="1" value={form.usage_limit} onChange={handleChange} placeholder="Để trống nếu không giới hạn" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Ngày bắt đầu</Form.Label>
                            <Form.Control type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Ngày kết thúc</Form.Label>
                            <Form.Control type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Check type="checkbox" label="Đang hoạt động" name="is_active" checked={form.is_active} onChange={handleChange} />
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShow(false)}>Hủy</Button>
                        <Button type="submit" style={{ backgroundColor: staffColors.midnightLagoon, border: "none" }}>
                            {editing ? "Lưu thay đổi" : "Tạo mã giảm giá"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffDiscount;
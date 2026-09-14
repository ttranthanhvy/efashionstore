import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./screens/Home/Home";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import { MyUserContext } from "./configs/Context";
import { useReducer } from "react";
import MyUserReducer from "./reducers/MyUserReducer";
import cookies from "react-cookies";
import ChangePassword from "./screens/User/ChangePassword";
import Profile from "./screens/User/Profile";
import ProductDetail from "./screens/Home/ProductDetail";
import Cart from "./screens/Cart/Cart";
import Order from "./screens/Order/Order";
import Checkout from "./screens/Payment/Checkout";
import PaymentStatus from "./screens/Payment/PaymentStatus";
import StaffOrder from "./screens/Staff/Order";
import StaffProduct from "./screens/Staff/Product";
import StaffProductDetail from "./screens/Staff/ProductDetail";
import StaffInventory from "./screens/Staff/Inventory";
import StaffDiscount from "./screens/Staff/Discount";

const App = () => {
  const [user, dispatch] = useReducer(
    MyUserReducer,
    cookies.load("user") || null
  );


  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-pasword" element={<ChangePassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Order />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentStatus />} />
          <Route path="/payment/failed" element={<PaymentStatus />} />
          <Route path="/staff/orders" element={<StaffOrder />} />
          <Route path="/staff/products" element={<StaffProduct />} />
          <Route path="/staff/products/:productId" element={<StaffProductDetail />} />
          <Route path="/staff/inventory" element={<StaffInventory />} /> 
          <Route path="/staff/discounts" element={<StaffDiscount />} />

        </Routes>

        <Footer />
      </BrowserRouter>
    </MyUserContext.Provider>

  );
}

export default App;
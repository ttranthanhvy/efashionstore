import axios from "axios";
import cookies from "react-cookies";

const BASE_URL = "http://127.0.0.1:8000/FashionStore/api";

export const endpoints = {
    login: "/auth/login/",
    register: "/auth/register/",
    refresh: "/auth/refresh/",
    profile: "/secure/profile/",
    changePassword: "/secure/change-password/",
    logout: "/auth/logout",

    categories: "/category/",
    products: "/product/",
    search: "/product/search/",
    "product-details": (productId) => `/product/${productId}/`,

    variants: (productId) => `/product/${productId}/variants/`,
    ratings: (productId) => `/product/${productId}/ratings/`,
    "secure-ratings": "/secure/ratings/",

    cart: "/secure/cart/",
    "cart-items": "/secure/cart/items/",

    orders: "/secure/orders/",
    "order-details": (orderId) => `/secure/orders/${orderId}/`,
    "variant-orders": (variantId) => `/variant/${variantId}/orders/`,
    vnpay: "/secure/payments/vnpay/",

    "staff-orders": "/secure/staff/orders/",
    "staff-order": (id) => `/secure/staff/orders/${id}/`,
    "staff-order-confirm": (id) => `/secure/staff/orders/${id}/confirm/`,
    "staff-order-status": (id) => `/secure/staff/orders/${id}/status/`,

    "staff-products": "/secure/staff/product/",
    "staff-product": (id) => `/secure/staff/product/${id}/`,
    "staff-variants": "/secure/staff/variant/",
    "staff-product-variants": (id) => `/secure/staff/product/${id}/variants/`,
    "staff-restock": "/secure/staff/variant/restock/",
    "staff-inventory": (id) => `/secure/staff/variant/${id}/inventory/`,
    "staff-variant": (id) => `/secure/staff/variant/${id}/`,
    "staff-discounts": "/secure/staff/discount/",
    "staff-discount": (id) => `/secure/staff/discount/${id}/`,
    "available-discounts": "/secure/discount/available/",
    "select-discount": "/secure/discount/select/",
};

const Api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

const refreshToken = async () => {
    const refresh = cookies.load("refresh_token");
    if (!refresh) {throw new Error("No refresh token");}
    const res = await axios.post(`${BASE_URL}${endpoints.refresh}`,{refresh: refresh},{withCredentials: true});
    return res.data.access;
};

const saveNewAccessToken = (access) => {
    cookies.save("access_token", access, {path: "/"});
};

Api.interceptors.request.use(
    (config) => {
        const access = cookies.load("access_token");
        const isPublic =
            config.url.includes("/category/") ||
            (
                config.url.includes("/product/") &&
                !config.url.includes("/secure/")
            );
        if (access && !isPublic) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${access}`
            };
        }
        return config;
    },(error) => Promise.reject(error)
);

Api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            (error.response?.status === 401 || error.response?.status === 403) && 
            !originalRequest._retry && 
            !originalRequest.url.includes("/auth/refresh/")
        ) {
            originalRequest._retry = true;

            try {
                const newAccess = await refreshToken();
                saveNewAccessToken(newAccess);
                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${newAccess}`
                };

                return Api(originalRequest);
            } catch (refreshError) {
                cookies.remove("user", {path: "/"});
                cookies.remove("access_token", {path: "/"});
                cookies.remove("refresh_token", {path: "/"});
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = () => {
    return axios.create({
        baseURL: BASE_URL,
        withCredentials: true
    });
};

export default Api;
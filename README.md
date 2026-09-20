# FashionStore

FashionStore is a fashion e-commerce system that supports users in browsing products, viewing product details and variants, managing shopping carts, placing orders, making payments, rating products, and managing personal information based on user roles.

The project consists of two main parts:

* **Backend**: Django REST Framework, used to implement RESTful APIs, authentication, business logic, data validation, and management functions.
* **Frontend**: ReactJS, used to build the customer-facing user interface.

External services are also integrated into the system:

* **Cloudinary**: Used to store and manage product and user images.
* **VNPay**: Used to process online payments.

---

## 1. Project Objectives

This project is built to simulate a fashion e-commerce system with the following main features:

* User registration, login, authentication, and authorization using JWT.
* Profile management and password change.
* Viewing products with search and filtering by category.
* Viewing product details and product variants such as color and size.
* Managing shopping carts and cart items.
* Creating and managing orders.
* Supporting Cash on Delivery (COD) and VNPay payments.
* Viewing order history and order details.
* Canceling eligible orders.
* Rating and reviewing products.
* Managing products, categories, variants, users, orders, and ratings based on user roles.
* Viewing sales and order statistics.
* Storing product and user images using Cloudinary.

> Note: The current version does **not integrate an AI recommendation model**. Personalized AI-based product recommendation is planned as a future improvement.

---

## 2. Overall Architecture

The project follows a 3-Tier Architecture:

```text
Client ReactJS
       |
       | HTTP/JSON
       v
Django REST Framework
       |
       | Django ORM
       v
MySQL Database
```

External services:

```text
Django REST Framework
       |
       ├── Cloudinary → Image Storage
       |
       └── VNPay → Online Payment
```

### Layer Responsibilities

| Layer              | Responsibility                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Presentation Layer | ReactJS builds the user interface and interacts with backend APIs.                                   |
| Application Layer  | Django REST Framework handles requests, authentication, validation, permissions, and business logic. |
| Data Layer         | MySQL stores users, products, variants, carts, orders, ratings, and related data.                    |
| External Services  | Cloudinary manages images and VNPay processes online payments.                                       |

---

## 3. Technologies Used

### 3.1. Backend

| Technology            | Usage in the project                                    |
| --------------------- | ------------------------------------------------------- |
| Python                | Backend programming language.                           |
| Django                | Web framework for building the backend application.     |
| Django REST Framework | Builds RESTful APIs and handles API requests/responses. |
| Django ORM            | Defines models and communicates with MySQL.             |
| JWT                   | Authenticates users and protects secured APIs.          |
| MySQL                 | Relational database management system.                  |
| Cloudinary            | Stores product and user images.                         |
| VNPay                 | Provides online payment functionality.                  |
| drf-yasg              | Generates API documentation.                            |
| Postman               | Tests backend APIs.                                     |
| Gunicorn              | Runs the Django application in deployment.              |
| WhiteNoise            | Serves static files in deployment.                      |

### 3.2. Frontend

| Technology            | Usage in the project                          |
| --------------------- | --------------------------------------------- |
| ReactJS               | Builds the user interface.                    |
| Axios                 | Sends HTTP requests to backend APIs.          |
| React Router          | Handles navigation between pages.             |
| React Bootstrap       | Builds responsive UI components.              |
| React Icons           | Provides icons for the interface.             |
| React Cookies         | Manages authentication-related cookies.       |
| Context API / Reducer | Manages global authentication and user state. |

### 3.3. Development & Deployment

| Technology         | Usage in the project                      |
| ------------------ | ----------------------------------------- |
| Visual Studio Code | Main development environment.             |
| Git                | Version control.                          |
| GitHub             | Source code management and collaboration. |
| Railway            | Deploys the backend application.          |
| Postman            | API testing and debugging.                |

---

## 4. Features by Role

### 4.1. Guest

Unauthenticated users can:

* View the homepage.
* View product lists.
* Search for products.
* Filter products by category.
* View product details.
* View product variants.
* View product ratings.
* Register an account.
* Log in to the system.

### 4.2. Customer

After logging in, customers can:

* View their personal profile.
* Update personal information.
* Manage their avatar.
* Browse and search products.
* Filter products by category.
* Select product variants.
* Add products to the shopping cart.
* Update cart item quantities.
* Remove products from the cart.
* Place orders.
* Choose COD or VNPay payment.
* View order history.
* View order details.
* Cancel eligible orders.
* Rate purchased products.
* Edit their own ratings.
* Delete their own ratings.

### 4.3. Staff

Staff members can:

* Manage products.
* Create, update, and manage product information.
* Manage product variants.
* Manage product inventory.
* Manage customer orders.
* Manage product ratings.

### 4.4. Admin

Administrators can manage the entire system:

* Manage users.
* Manage staff accounts.
* Reject staff accounts.
* Manage categories.
* View dashboard statistics.

---

## 5. Suggested Folder Structure

The backend is organized into Django applications and supporting modules:

```text
FashionStoreApi/
├── manage.py
├── requirements.txt
├── FashionStore/
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── permissions.py
│   ├── services.py
│   └── ...
└── ...
```

The ReactJS frontend is organized separately:

```text
fstoreapp/
├── package.json
├── public/
└── src/
    ├── assets/
    ├── components/
    ├── configs/
    ├── contexts/
    ├── reducers/
    ├── screens/
    ├── configs/
    ├── App.css
    └── App.js
```

---

## 6. Environment Requirements

Before running the project, install the following tools.

### Backend

* Python 3.x
* MySQL 8.x
* pip
* Git
* Postman
* Visual Studio Code

### Frontend

* Node.js LTS
* npm

Check versions:

```bash
python --version
pip --version
node -v
npm -v
```

---

## 7. Backend Setup

### 7.1. Clone the project

```bash
git clone https://github.com/ttranthanhvy/efashionstore.git
cd FashionStoreApi
```

### 7.2. Create a virtual environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

### 7.3. Install backend dependencies

```bash
pip install -r requirements.txt
```

Main dependencies include:

```text
Django
djangorestframework
djangorestframework-simplejwt
mysqlclient / PyMySQL
cloudinary
drf-yasg
gunicorn
whitenoise
```

### 7.4. Create the MySQL database

Create the database using MySQL:

```sql
CREATE DATABASE fstoredb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure the database connection in the Django settings.

Example:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "fstoredb",
        "USER": "root",
        "PASSWORD": "your_password",
        "HOST": "localhost",
        "PORT": "3306",
    }
}
```

### 7.5. Configure Cloudinary

The project uses Cloudinary to store product and user images.

Example configuration:

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do not commit real Cloudinary credentials to GitHub.

### 7.6. Configure VNPay

Example configuration:

```text
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_RETURN_URL=your_return_url
```

Do not commit the real VNPay credentials to a public repository.

### 7.7. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7.8. Create an administrator

```bash
python manage.py createsuperuser
```

### 7.9. Run the backend

```bash
python manage.py runserver
```

The backend runs at:

```text
http://127.0.0.1:8000/
```

API base URL:

```text
http://127.0.0.1:8000/FashionStore/api/
```

---

## 8. Frontend Setup

### 8.1. Move to the frontend directory

```bash
cd fstoreapp
```

### 8.2. Install dependencies

```bash
npm install
```

### 8.3. Configure the API base URL

Example:

```javascript
const BASE_URL = "http://127.0.0.1:8000/FashionStore/api";
```

For deployment, change the API base URL to the deployed backend URL.

### 8.4. Run the frontend

```bash
npm start
```

The frontend usually runs at:

```text
http://localhost:3000
```

---

## 9. Authentication and Authorization

The project uses **JWT authentication** to protect secured APIs.

The system provides three main roles:

```text
ADMIN
STAFF
CUSTOMER
```

Authentication flow:

```text
User
  |
  | Login
  v
Django REST API
  |
  | Validate credentials
  v
JWT Token
  |
  v
Frontend
  |
  | Authorization
  v
Protected APIs
```

Secured APIs require a valid authentication token.

Role-based permissions are used to restrict access to administrative and staff functions.

---

## 10. Main API Groups

### 10.1. Authentication API

| Method | Endpoint                  | Description                         |
| ------ | ------------------------- | ----------------------------------- |
| POST   | `/auth/login`             | Authenticate a user.                |
| POST   | `/auth/register`          | Register a new customer account.    |
| GET    | `/secure/profile`         | Get the current user's profile.     |
| PATCH  | `/secure/profile`         | Update the current user's profile.  |
| PATCH  | `/secure/change-password` | Change the current user's password. |
| POST   | `/auth/refresh`           | Refresh the access token.           |

### 10.2. Category API

| Method | Endpoint                 | Description                      |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/category/`             | Get the category list.           |
| GET    | `/category/{id}/`        | Get category details.            |
| POST   | `/secure/category/`      | Create a category.               |
| PATCH  | `/secure/category/{id}/` | Update a category.               |
| DELETE | `/secure/category/{id}/` | Delete or deactivate a category. |

### 10.3. Product API

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/product/`             | Get the product list.           |
| GET    | `/product/{id}/`        | Get product details.            |
| POST   | `/secure/product/`      | Create a product.               |
| PATCH  | `/secure/product/{id}/` | Update a product.               |
| DELETE | `/secure/product/{id}/` | Delete or deactivate a product. |

Product APIs support features such as:

* Search
* Category filtering
* Parent category filtering
* New products
* Popular products
* Product variants
* Product ratings

### 10.4. Product Variant API

| Method | Endpoint                 | Description               |
| ------ | ------------------------ | ------------------------- |
| GET    | `/variants/`             | Get product variants.     |
| POST   | `/secure/variants/`      | Create a product variant. |
| PATCH  | `/secure/variants/{id}/` | Update a product variant. |
| DELETE | `/secure/variants/{id}/` | Delete a product variant. |

Product variants contain information such as:

* Color
* Size
* Price
* Stock
* Minimum stock
* Product image

### 10.5. Shopping Cart API

| Method | Endpoint                   | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/secure/cart/`            | Get the current user's cart.  |
| POST   | `/secure/cart/items/`      | Add an item to the cart.      |
| PATCH  | `/secure/cart/items/{id}/` | Update cart item quantity.    |
| DELETE | `/secure/cart/items/{id}/` | Remove an item from the cart. |

Each customer has one shopping cart.

### 10.6. Order API

| Method | Endpoint                      | Description                                              |
| ------ | ----------------------------- | -------------------------------------------------------- |
| GET    | `/secure/orders/`             | Get the current user's orders.                           |
| POST   | `/secure/orders/`             | Create a new order.                                      |
| GET    | `/secure/orders/{id}/`        | Get order details.                                       |
| PATCH  | `/secure/orders/{id}/`        | Update order information/status according to permission. |
| POST   | `/secure/orders/{id}/cancel/` | Cancel an eligible order.                                |

Order information includes:

* Customer
* Order details
* Product variants
* Quantity
* Price
* Shipping information
* Payment method
* Order status
* Order history

### 10.7. Rating API

| Method | Endpoint                | Description                           |
| ------ | ----------------------- | ------------------------------------- |
| GET    | `/secure/ratings/`      | Get ratings according to permissions. |
| POST   | `/secure/ratings/`      | Create a product rating.              |
| PATCH  | `/secure/ratings/{id}/` | Update the user's rating.             |
| DELETE | `/secure/ratings/{id}/` | Delete the user's rating.             |

Ratings use a value from **1 to 5**.

The product's average rating is updated when ratings are created, modified, or deleted.

### 10.8. VNPay API

| Method | Endpoint                   | Description                       |
| ------ | -------------------------- | --------------------------------- |
| POST   | `/secure/payments/vnpay`   | Create a VNPay payment URL.       |
| GET    | `/payments/vnpay/callback` | Receive the VNPay payment result. |

VNPay payment flow:

```text
Customer
   |
   | Create Order
   v
FashionStore Backend
   |
   | Create Payment URL
   v
VNPay
   |
   ├── Success
   |      |
   |      v
   |  Payment Callback
   |      |
   |      v
   | Update Payment & Order
   |
   └── Failed
          |
          v
     Payment Failed
```

---

## 11. Database

The project uses **MySQL** as the relational database.

Main entities include:

```text
User
Category
Product
ProductVariant
Cart
CartItem
Rating
Order
OrderDetail
OrderHistory
Discount
```

Main relationships include:

```text
User
 ├── Cart
 ├── Orders
 └── Ratings

Category
 └── Products

Product
 ├── ProductVariants
 └── Ratings

Cart
 └── CartItems

Order
 ├── OrderDetails
 └── OrderHistory

ProductVariant
 └── OrderDetails
```

The database uses:

* Primary keys
* Foreign keys
* Unique constraints
* Domain/value constraints
* Validation rules
* Relationship constraints

to maintain data integrity.

---

## 12. Security Rules

The system applies role-based authorization and validation rules.

Important security principles:

* Secured APIs require authentication.
* Admin APIs are only accessible to administrators.
* Staff APIs are only accessible to authorized staff.
* Customers cannot access administrative functions.
* Users can only modify their own profile and ratings.
* Passwords must never be returned in API responses.
* Sensitive configuration such as database passwords, Cloudinary secrets, and VNPay secrets must not be committed to GitHub.
* API input data must be validated before processing.
* Product stock must be checked before creating an order.
* VNPay payment responses must be validated before updating payment status.

Quick test examples:

| Case                                      | Expected Result       |
| ----------------------------------------- | --------------------- |
| Access secured API without authentication | `401 Unauthorized`    |
| Customer accesses admin API               | `403 Forbidden`       |
| User edits another user's rating          | `403 Forbidden`       |
| Invalid product quantity                  | `400 Bad Request`     |
| Invalid rating value                      | `400 Bad Request`     |
| Insufficient product stock                | Request rejected      |
| Invalid VNPay response                    | Payment not confirmed |

---

## 13. Payment

FashionStore supports two payment methods:

| Payment Method | Description                                      |
| -------------- | ------------------------------------------------ |
| COD            | Customer pays when receiving the order.          |
| VNPay          | Customer pays through the VNPay payment gateway. |

VNPay is integrated as an external payment service and is not part of the three main application layers.

---

## 14. Image Management

FashionStore uses **Cloudinary** to store images.

Images include:

* User avatars
* Product thumbnails
* Product variant images

The application stores the Cloudinary image information and uses the returned URL to display images in the ReactJS frontend.

```text
ReactJS
   |
   | Upload Image
   v
Django REST Framework
   |
   v
Cloudinary
   |
   | Image URL
   v
MySQL / Application Data
```

---

## 15. Testing

The backend REST APIs are tested using **Postman**.

Testing includes:

* Authentication
* User APIs
* Category APIs
* Product APIs
* Product variant APIs
* Cart APIs
* Order APIs
* Rating APIs
* VNPay payment APIs
* Authorization and permission cases
* Validation and error handling

---

## 16. Deployment

The project is deployed using **Railway**.

Deployment architecture:

```text
ReactJS Frontend
       |
       | REST API
       v
Django REST Framework
       |
       v
MySQL

External Services
├── Cloudinary
└── VNPay
```

The backend application is configured for production deployment using **Gunicorn** and **WhiteNoise**.

Example backend deployment URL:

```text
https://efashionstore-production.up.railway.app
```

API base path:

```text
https://efashionstore-production.up.railway.app/FashionStore/api/
```

---

## 17. Project Scope

The current project focuses on developing the core functions of a fashion e-commerce system:

* User authentication and authorization
* Product and category management
* Product variant management
* Shopping cart
* Order management
* Product ratings
* COD payment
* VNPay online payment
* Image management with Cloudinary
* Sales and order statistics

The current version **has not integrated AI**.

The project structure can be extended in the future to support personalized product recommendations.

---

## 18. Future Development

Potential improvements include:

* Integrate an AI-based personalized product recommendation system.
* Improve product search.
* Add real-time customer support/chat.
* Improve sales analytics.
* Optimize API performance.
* Improve caching and database query performance.
* Enhance authentication and security.

---

## 19. Quick Start Summary

### Backend

```bash
cd FashionStoreApi

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000/
```

API:

```text
http://127.0.0.1:8000/FashionStore/api/
```

### Frontend

```bash
cd fstoreapp
npm install
npm start
```

Frontend:

```text
http://localhost:3000
```

---

## 20. Notes

* Do not commit `.env` files or sensitive credentials.
* Configure MySQL before running the backend.
* Configure Cloudinary before uploading images.
* Configure VNPay before testing online payment.
* Use Postman to test APIs independently from the frontend.
* Make sure the frontend API base URL matches the backend environment.

---

## Author

**Trần Thanh Vy**

Information Technology Student

**Technologies:** Python · Django REST Framework · ReactJS · MySQL · Cloudinary · VNPay

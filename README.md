# 🚀 VendorBridge - Procurement & Vendor Management ERP

VendorBridge is an Odoo-inspired Procurement & Vendor Management ERP system. It streamlines the lifecycle of corporate procurement from Requests for Quotation (RFQs) and vendor bidding comparisons to automated Purchase Orders (POs) and tax-calculated Invoices with real-time PDF generation and email dispatches.

Designed with a premium **Slate Neutral** aesthetic, the application features role-based dashboards, secure workflow state machines, automated notifications, and comprehensive administrative audit logs.

---

## 🌟 Key Features

### 🔐 Role-Based Access Control (RBAC)
- **Four Roles:** Admin, Procurement Officer, Manager, and Vendor.
- **Self-Signup:** Public self-registration for vendors.
- **Forced Password Reset:** Mandatory password reset for staff accounts upon their first login.
- **Recovery Flow:** Secure token-based password reset sent via email.

### 📋 Request for Quotation (RFQ) Board
- Full CRUD management of procurement sheets.
- Supports multi-line items with standard units and quantities.
- Targeted invitations to specific registered vendors.
- Support for PDF/document attachments.

### 📊 Interactive Bid Comparison
- **Side-by-Side Grid:** Officer/Manager utility to review submitted vendor bids.
- **Calculated Highlights:** Automatically flags and highlights the cheapest bid.
- **Delivery Timeline Sorting:** Sort bids dynamically based on cost or speed.

### 📦 Purchase Order (PO) State Machine
- Automated **Draft PO** generation immediately upon awarding a Quotation.
- State-machine status changes:
  - `Draft` ➔ `Sent` (Officer dispatches to Vendor)
  - `Sent` ➔ `Confirmed` (Vendor reviews and accepts PO)
  - `Confirmed` ➔ `Delivered` (Officer records receipt of goods)

### 📄 Invoices & GST Calculations (18%)
- One-click invoice generation from confirmed Purchase Orders.
- Automated 18% standard GST taxation grid computations.
- Real-time PDF invoice generation using `pdfkit`.
- Automated email delivery attaching the PDF buffer via `nodemailer`.
- Visual PDF preview downloads and system browser printing.

### 🔍 Administrative Loggers
- **Audit Logs:** Full immutable timeline capturing actions, roles, timestamps, and before/after values of changes.
- **Notification Center:** Header alert dropdown listing invitation statuses and updates.

---

## 🛠️ Technology Stack

### Backend
- **Node.js** & **Express 5**
- **MongoDB Atlas** with **Mongoose 9**
- **pdfkit** (Dynamic PDF Compiler)
- **nodemailer** (SMTP Email Dispatcher)
- **JSON Web Tokens (JWT)** & **cookies-parser**

### Frontend
- **React.js** (built with Create React App)
- **React Router v7**
- **Tabler Icons React** (Vector Icons)
- **Recharts** (Interactive Dashboards)
- **react-hot-toast** (Status alerts)

---

## 📂 Folder Structure

```text
vendorbridge/
├── backend/
│   ├── config/             # Database connection setup
│   ├── models/             # Mongoose schemas (User, Vendor, RFQ, Quotation, PO, Invoice, Log)
│   ├── controllers/        # Core business operations
│   ├── middleware/         # Auth, JWT, and role protection
│   ├── routes/             # API Endpoints
│   ├── utils/              # Email, audit logger, and seed helpers
│   └── server.js           # Server startup script
└── frontend/
    ├── public/             # Static page entry
    └── src/
        ├── api/            # Unified Axios HTTP interceptors
        ├── components/     # Navbar, Sidebar, Protected layouts
        ├── context/        # Session contexts
        └── pages/          # Auth, RFQs, Bids, Comparisons, POs, Invoices, Logs
```

---

## 🚀 Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB connection URI
- SMTP Gmail credentials (for email dispatch)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/VendorBridge.git
cd VendorBridge
```

### 2. Configure Backend `.env`
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### 3. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
*The server will start running on port `5000`.*

### 4. Configure Frontend `.env`
Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Install & Start Frontend
```bash
cd ../frontend
npm install
npm start
```
*The React app will start running on [http://localhost:3000](http://localhost:3000).*

---

## 👥 Seed User Credentials
To log in immediately for evaluation, use the pre-configured credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@vendorbridge.com` | `admin123` |
| **Vendor** | `vendor1@vendorbridge.com` | `vendor123` |

---

## 📝 License
This project is licensed under the MIT License.

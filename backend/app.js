const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");
const RFQRoutes = require("./routes/rfq.routes");
const QuotationRoutes = require("./routes/quotation.routes");
const NotificationRoutes = require("./routes/notification.routes");
const UserRoutes = require("./routes/user.routes");
const DashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ message: "VendorBridge API is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfq", RFQRoutes);
app.use("/api/quotations", QuotationRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/dashboard', DashboardRoutes);

module.exports = app;

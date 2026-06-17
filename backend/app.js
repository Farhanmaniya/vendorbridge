const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.json({ message: 'VendorBridge API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);

module.exports = app;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text, attachments = []) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text,
    };
    if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
    }
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
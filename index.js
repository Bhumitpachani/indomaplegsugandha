const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// CORS Configuration - Allow all origins
app.use(cors({
  origin: '*', // Allow all origins, or specify your frontend URL like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware to parse JSON
app.use(express.json());


// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'gagandeep.inspire@gmail.com',
    pass: 'hinkmclmudvkavuu'
  }
});

// API endpoint to send email - FULLY DYNAMIC
app.post('/api/send-contact', async (req, res) => {
  try {
    const { 
      from,           // Sender email and name (e.g., "John <john@example.com>")
      to,             // Recipient(s) - can be string or array
      cc,             // CC recipients (optional)
      bcc,            // BCC recipients (optional)
      subject,        // Email subject
      html,           // HTML content
      text,           // Plain text content (optional)
      attachments     // Attachments (optional)
    } = req.body;

    // Basic validation
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: to, subject, and html'
      });
    }

    // Validate email format for 'to' field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = Array.isArray(to) ? to : to.split(',').map(e => e.trim());
    
    for (let email of toEmails) {
      // Extract email from "Name <email@example.com>" format
      const emailMatch = email.match(/<([^>]+)>/) || [null, email];
      if (!emailRegex.test(emailMatch[1].trim())) {
        return res.status(400).json({
          success: false,
          message: `Invalid email address: ${email}`
        });
      }
    }

    // Build mail options dynamically
    const mailOptions = {
      from: from || '<gagandeep.inspire@gmail.com>', 
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html
    };

    // Add optional fields if provided
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    if (text) mailOptions.text = text;
    if (attachments) mailOptions.attachments = attachments;

    // Send email
    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nodemailer API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

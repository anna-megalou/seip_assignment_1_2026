const express = require('express');
const app = express();

// External configurations driven by environment variables
const PORT = process.env.PORT || 3000;
const WELCOME_MSG = process.env.WELCOME_MESSAGE || "Default message: Configuration missing!";
const API_KEY = process.env.API_SECRET_KEY || "UNSECURE_DEFAULT_DEV_KEY";

app.get('/', (req, res) => {
    res.json({ 
        message: WELCOME_MSG,
        environment: process.env.NODE_ENV || "production"
    });
});

// Secure endpoint relying on the injected Secret
app.get('/secure-config', (req, res) => {
    if (API_KEY === "UNSECURE_DEFAULT_DEV_KEY") {
        return res.status(500).json({ error: "Security breach: Production secret key was not injected!" });
    }
    // Partially mask the secret to prove it was injected safely without leaking it entirely
    const maskedKey = API_KEY.length > 4 ? '*'.repeat(API_KEY.length - 4) + API_KEY.slice(-4) : '****';
    res.json({
        status: "Authorized",
        injected_secret_suffix: maskedKey
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Healthy' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
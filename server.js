const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 🔥 DEBUG: Check PORT from Render
console.log("ENV PORT:", process.env.PORT);

// 🔥 HEALTH CHECK (for Render + debugging)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// 🔥 REQUEST LOGGER (helps debug live issues)
app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});

// CONFIG
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'JAISHREERAM';
const DATA_FILE = path.join(process.cwd(), 'responses.json');

// BODY PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({ origin: '*' }));

// STATIC FILES
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(__dirname));

// Ensure responses.json exists
if (!fs.existsSync(DATA_FILE)) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    } catch (err) {
        console.error('Error creating data file:', err);
    }
}

// ROOT ROUTE (SAFE)
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    console.log('Serving:', filePath);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error loading page');
        }
    });
});

// ADMIN PAGE
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// FORM SUBMISSION
app.post('/api/register', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString();
    const id = Date.now();

    const newResponse = { id, timestamp, ...data };

    try {
        let currentData = [];

        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');

            if (rawData) {
                try {
                    currentData = JSON.parse(rawData);
                } catch (err) {
                    console.error('JSON parse error, resetting file');
                    currentData = [];
                }
            }
        }

        currentData.push(newResponse);
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf8');

        res.json({ success: true, message: 'Response saved!' });

    } catch (error) {
        console.error('Error saving response:', error);
        res.status(500).json({ success: false });
    }
});

// ADMIN DATA
app.get('/api/responses', (req, res) => {
    const auth = req.headers.authorization;

    if (auth !== ADMIN_KEY) {
        return res.status(401).json({ success: false });
    }

    try {
        let currentData = [];

        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');

            if (rawData) {
                try {
                    currentData = JSON.parse(rawData);
                } catch (err) {
                    console.error('JSON parse error');
                    currentData = [];
                }
            }
        }

        res.json(currentData);

    } catch (error) {
        console.error('Error reading responses:', error);
        res.status(500).json({ success: false });
    }
});

// FALLBACK ROUTE
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔥 FINAL LISTEN (CRITICAL FIX)
app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 1. PORT FIX (CRITICAL)
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'JAISHREERAM';
const DATA_FILE = path.join(process.cwd(), 'responses.json');

// 4. BODY PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. CORS SUPPORT
app.use(cors({
    origin: '*'
}));

// 2. STATIC FILE SERVING
// Serve the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));
// Serve other static assets from root directory (like CSS, JS if any)
app.use(express.static(__dirname));

// Initialize responses.json safely
if (!fs.existsSync(DATA_FILE)) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    } catch (err) {
        console.error('Error creating data file:', err);
    }
}

// 3. ROUTING FIX
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 7. API ENDPOINTS (Form Submission)
app.post('/api/register', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString();
    const id = Date.now();

    const newResponse = {
        id,
        timestamp,
        ...data
    };

    try {
        // 6. FILE STORAGE HANDLING
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
        // 8. ERROR HANDLING
        console.error('Error saving response:', error);
        res.status(500).json({ success: false, message: 'Internal server error while saving data' });
    }
});

// Admin data endpoint
app.get('/api/responses', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== ADMIN_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

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
        res.json(currentData);
    } catch (error) {
        // 8. ERROR HANDLING
        console.error('Error reading responses:', error);
        res.status(500).json({ success: false, message: 'Error reading responses' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Zykora Server running at http://localhost:${PORT}`);
});

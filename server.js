const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// Use the PORT from environment variables (Render will set it)
const PORT = process.env.PORT || 3000;  // Default to 3000 if PORT is not set

// Create directories if they don't exist
if (!fs.existsSync(path.join(__dirname, 'captured_images'))) {
    fs.mkdirSync(path.join(__dirname, 'captured_images'));
}
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json({ limit: '10mb' }));

// Route to handle image and location data
app.post('/upload', (req, res) => {
    const { latitude, longitude, image } = req.body;

    // Save the image as a file
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const imageFilename = `image_${Date.now()}.png`;
    const imagePath = path.join(__dirname, 'captured_images', imageFilename);

    fs.writeFile(imagePath, base64Data, 'base64', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving image.' });
        }

        // Append location and image information to a JSON file
        const locationData = {
            timestamp: new Date().toISOString(),
            latitude: latitude,
            longitude: longitude,
            image: imageFilename
        };

        const logFilePath = path.join(__dirname, 'data', 'location_data.json');
        fs.appendFile(logFilePath, JSON.stringify(locationData) + ',\n', (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving location data.' });
            }
            res.status(200).json({ message: 'Image and location saved successfully!', latitude, longitude });
        });
    });
});

// Start the server and listen on the correct network interface
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

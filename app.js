require("dotenv").config();

const { NGROK_ACTIVE, NGROK_TOKEN, NGROK_SUBDOMAIN } = process.env;

const { printPhoto } = require('./print');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');




const app = express();
app.use(bodyParser.urlencoded({ extended: false }));


app.post('/', async (req, res) => {
    const { MessageSid, NumMedia, MediaContentType0, MediaUrl0 } = req.body;

    const twiml = new twilio.twiml.MessagingResponse();

    if (NumMedia > 0 && (MediaContentType0 === 'image/png' || MediaContentType0 === 'image/jpeg')) {
        try {
            console.log(`Processing image from MessageSid: ${MessageSid}`);
            await printPhoto(MessageSid, MediaUrl0);
            twiml.message('Image received and sent to printer!');
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            res.end(twiml.toString());
        } catch (error) {
            console.error('Error printing photo:', error);
            twiml.message('Failed to process the image.');
            res.writeHead(500, { 'Content-Type': 'text/xml' });
            res.end(twiml.toString());
        }
    } else {
        twiml.message(`No valid image found in the message.\n\nPlease send an image to print.\n\nIn case you want to check our source-code, open https://twil.io/whatsapp-photo-printer`);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    if (NGROK_ACTIVE) {
        console.log('Starting NGROK...');
        const ngrok = require('ngrok');
        SERVER = await ngrok.connect({ authtoken: NGROK_TOKEN, addr: PORT, subdomain: NGROK_SUBDOMAIN });
        console.log('URL:', SERVER);
    }

});
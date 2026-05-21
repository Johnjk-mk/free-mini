const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// This web server is crucial. It keeps Render from thinking the app is dead.
app.get('/', (req, res) => {
    res.send('Bot is active!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    startBot(); // Start the bot only after the server starts
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Must be FALSE for cloud hosting
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('creds.update', saveCreds);

    // This handles the Pairing Code generation
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = '2348012345678'; // <-- IMPORTANT: Use your actual number
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n--- PAIRING CODE: ${code} ---\n`);
            } catch (err) {
                console.error("Pairing Error:", err);
            }
        }, 5000); 
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) {
                console.log("Reconnecting...");
                startBot();
            }
        } else if (connection === 'open') {
            console.log("Bot is online and connected!");
        }
    });
}

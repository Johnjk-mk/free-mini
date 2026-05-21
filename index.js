const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is active!');
});

// Start the express server first
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    // Start the bot after the server is up
    startBot();
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
    });

    // Pairing code logic
    if (!sock.authState.creds.registered) {
        const phoneNumber = '2348012345678'; // Use YOUR actual number
        setTimeout(async () => {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n--- PAIRING CODE: ${code} ---\n`);
        }, 5000); // 5 second delay
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log("Bot is online and connected!");
        }
    });
}

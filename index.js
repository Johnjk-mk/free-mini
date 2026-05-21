const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is active!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    startBot();
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = '2348142113278'; // Your number is set here
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n--- PAIRING CODE: ${code} ---\n`);
            } catch (err) {
                console.error("Pairing Error:", err);
            }
        }, 10000); 
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Reconnecting...");
                startBot();
            }
        } else if (connection === 'open') {
            console.log("Bot is online and connected!");
        }
    });
}

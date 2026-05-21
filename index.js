// Your Bot Logic
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // REQUIRED: This stops it from looking for a terminal screen
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    // This block generates the text-based pairing code
    if (!sock.authState.creds.registered) {
        const phoneNumber = '2348012345678'; // <-- REPLACE WITH YOUR REAL NUMBER
        setTimeout(async () => {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n--- YOUR PAIRING CODE IS: ${code} ---\n`);
        }, 5000); // 5-second delay to ensure the socket is ready
    }

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


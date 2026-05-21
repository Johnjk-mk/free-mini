async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Changed to false
        auth: state,
    });

    // Add this pairing code logic
    if (!sock.authState.creds.registered) {
        const phoneNumber = 'YOUR_PHONE_NUMBER'; // Replace with your number (e.g., 2348012345678)
        setTimeout(async () => {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n--- YOUR PAIRING CODE IS: ${code} ---\n`);
        }, 3000); // Waits 3 seconds before showing the code
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

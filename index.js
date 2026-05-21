async function startBot() {
    // 1. Use an absolute path for the session folder to avoid permission issues
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        // Adding this browser config helps with cloud authentication
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        // This forces the bot to avoid attempting a quick resume that triggers the 428
        connectTimeoutMs: 60000, 
    });

    sock.ev.on('creds.update', saveCreds);

    // 2. Only request pairing code if there is no registered session
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = '2348012345678'; // <-- USE YOUR ACTUAL NUMBER
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n--- PAIRING CODE: ${code} ---\n`);
            } catch (err) {
                console.error("Pairing Error:", err);
            }
        }, 10000); // 10-second delay for full initialization
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            // 428 or 401 errors usually mean the session is bad
            const statusCode = lastDisconnect.error?.output?.statusCode;
            if (statusCode === 428 || statusCode === 401) {
                console.log("Session invalid, please delete the 'session' folder in GitHub.");
            }
            
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Reconnecting...");
                startBot();
            }
        } else if (connection === 'open') {
            console.log("Bot is online and connected!");
        }
    });
}

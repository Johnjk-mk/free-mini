async function startBot() {
    // Ensure we are using a persistent path or a simple local one
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        // Browser config helps identify the connection properly
        browser: ['Ubuntu', 'Chrome', '20.0.04'] 
    });

    sock.ev.on('creds.update', saveCreds);

    // Only request pairing code if not already registered
    if (!sock.authState.creds.registered) {
        // Delaying ensures the socket has time to initialize
        setTimeout(async () => {
            const phoneNumber = '2348012345678'; // Use your actual number
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n--- PAIRING CODE: ${code} ---\n`);
            } catch (err) {
                console.error("Pairing code error:", err);
            }
        }, 8000); 
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            // Check if it's a permanent disconnect
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) {
                console.log("Connection lost, reconnecting...");
                startBot();
            }
        } else if (connection === 'open') {
            console.log("Successfully connected to WhatsApp!");
        }
    });
}

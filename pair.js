const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const MESSAGE = process.env.MESSAGE || `
*SESSION GENERATED SUCCESSFULLY* ✅

🚨 *Attention!* 🚨
Do not share your session with anyone! RedFox Inc. is not responsible for any misuse.

If you encounter issues, contact the admin:
👇
http://redfox-inc.22web.org/✅

🦊 Explore, *𝙷𝙾𝚁𝙸𝚉𝙾𝙽-𝙼𝙳* by RedFox.

*Powered by ©RedFox-Coders™* 💝
`;

const { upload } = require('./mega');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function RedFoxHandler() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        try {
            let RedFoxSocket = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!RedFoxSocket.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await RedFoxSocket.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code: `<RedFox> ${code}` });
                }
            }

            RedFoxSocket.ev.on('creds.update', saveCreds);
            RedFoxSocket.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        if (fs.existsSync('./auth_info_baileys/creds.json'));

                        const auth_path = './auth_info_baileys/';
                        let user = RedFoxSocket.user.id;

                        // Define randomMegaId function to generate random IDs
                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        
                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        const Id_session = mega_url.replace('https://mega.nz/file/', '');

                        const middleIndex = Math.floor(Id_session.length / 2);
                        const Scan_Id = `${Id_session.slice(0, middleIndex)}<RedFox>${Id_session.slice(middleIndex)}`;

                        let msgsss = await RedFoxSocket.sendMessage(user, { text: Scan_Id });
                        await RedFoxSocket.sendMessage(
                                user, 
                                    { 
                                    image: { url: 'https://iili.io/24zBVF1.png'},
                                    caption: MESSAGE
                                    },
                                    { 
                                    quoted: msgsss
                                    });
                        
                        await delay(1000);
                        try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) {console.console.log("Error during emptying the creds folder: ", e
                            
                        )}

                    } catch (e) {
                        console.log("Error during file upload or message send: ", e);
                    }

                    await delay(100);
                    await fs.emptyDirSync(__dirname + '/auth_info_baileys');
                }

                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        RedFoxHandler().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                        await delay(5000);
                        exec('pm2 restart redfox');
                    }
                }
            });

        } catch (err) {
            console.log("Error in RedFoxHandler function: ", err);
            exec('pm2 restart redfox');
            console.log("Service restarted due to error");
            RedFoxHandler();
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
            if (!res.headersSent) {
                await res.send({ code: "Try After Few Minutes" });
            }
        }
    }

    await RedFoxHandler();
});

module.exports = router;
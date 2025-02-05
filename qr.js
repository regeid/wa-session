const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const express = require('express');
const pino = require("pino");
const { toBuffer } = require("qrcode");
const path = require('path');
const fs = require("fs-extra");
const os = require('os');  // Menggunakan direktori sementara yang disediakan oleh Vercel
const { Boom } = require("@hapi/boom");

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_auth_domain",
  projectId: "your_project_id",
  storageBucket: "your_storage_bucket",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id"
};

const MESSAGE = process.env.MESSAGE || `
*SESSION GENERATED SUCCESSFULY* ✅

*Gɪᴠᴇ ᴀ ꜱᴛᴀʀ ᴛᴏ ʀᴇᴘᴏ ꜰᴏʀ ᴄᴏᴜʀᴀɢᴇ* 🌟
https://github.com/GuhailTechInfo/ULTRA-MD

*Sᴜᴘᴘᴏʀᴛ Gʀᴏᴜᴘ ꜰᴏʀ ϙᴜᴇʀʏ* 💭
https://t.me/GlobalBotInc
https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07

*Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 🪄 
https://youtube.com/GlobalTechInfo

*ULTRA-MD--WHATTSAPP-BOT* 🥀
`;

const router = express.Router();
initializeApp(firebaseConfig);
const storage = getStorage();

router.get('/', async (req, res) => {
  const { default: SuhailWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason, makeInMemoryStore } = require("@whiskeysockets/baileys");

  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

  async function SUHAIL() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(os.tmpdir(), 'auth_info_baileys'));  // Ganti ke direktori sementara

    try {
      let Smd = SuhailWASocket({
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: state
      });

      Smd.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;

        if (qr) {
          // Ensure the response is only sent once
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'image/png');
            try {
              const qrBuffer = await toBuffer(qr);  // Convert QR to buffer
              res.end(qrBuffer);  // Send the buffer as the response
              return; // Exit to avoid sending more responses
            } catch (error) {
              console.error("Error generating QR Code buffer:", error);
              return;  // Exit after sending the error response
            }
          }
        }

        if (connection == "open") {
          await delay(3000);
          let user = Smd.user.id;

          const authPath = path.join(os.tmpdir(), 'auth_info_baileys', 'creds.json');
          
          // Upload ke Firebase Storage
          const fileBuffer = fs.readFileSync(authPath);
          const storageRef = ref(storage, `auth/${Date.now()}-creds.json`);
          await uploadBytes(storageRef, fileBuffer);
          const firebaseUrl = await getDownloadURL(storageRef);

          console.log(`SESSION ID ==> ${firebaseUrl}`);

          let msgsss = await Smd.sendMessage(user, { text: firebaseUrl });
          await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });

          await delay(1000);
          try {
            await fs.emptyDirSync(path.join(os.tmpdir(), 'auth_info_baileys'));  // Clear temporary directory
          } catch (e) {
            console.error('Error clearing directory:', e);
          }
        }

        Smd.ev.on('creds.update', saveCreds);

        if (connection === "close") {
          let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          console.log("Connection closed with reason:", DisconnectReason[reason] || reason);

          if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required, restarting...");
            SUHAIL().catch(err => console.log(err));
          } else {
            console.log('Connection closed with bot. Please run again.');
            await delay(5000);
            process.exit(0);
          }
        }
      });
    } catch (err) {
      console.log(err);
      await fs.emptyDirSync(path.join(os.tmpdir(), 'auth_info_baileys'));  // Clear temporary directory
    }
  }

  await SUHAIL().catch(async (err) => {
    console.log(err);
    await fs.emptyDirSync(path.join(os.tmpdir(), 'auth_info_baileys'));  // Clear temporary directory
  });
});

module.exports = router;

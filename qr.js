const { upload } = require('./mega');
const express = require('express');
const pino = require("pino");
const { toBuffer } = require("qrcode");
const path = require('path');
const fs = require("fs-extra");
const os = require('os');  // Menggunakan direktori sementara yang disediakan oleh Vercel
const { Boom } = require("@hapi/boom");

const MESSAGE = process.env.MESSAGE ||  `
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

          // Generate random Mega ID and upload to Mega
          function randomMegaId(length = 6, numberLength = 4) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
              result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
            return `${result}${number}`;
          }

          const auth_path = path.join(os.tmpdir(), 'auth_info_baileys');  // Ganti ke direktori sementara
          const mega_url = await upload(fs.createReadStream(path.join(auth_path, 'creds.json')), `${randomMegaId()}.json`);

          const string_session = mega_url.replace('https://mega.nz/file/', '');
          const Scan_Id = string_session;

          console.log(`SESSION ID ==> ${Scan_Id}`);

          let msgsss = await Smd.sendMessage(user, { text: Scan_Id });
          await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });

          await delay(1000);
          try {
            await fs.emptyDirSync(auth_path);  // Clear temporary directory
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

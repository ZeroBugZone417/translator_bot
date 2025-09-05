const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const translate = require('@vitalets/google-translate-api')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const body =
      msg.message.conversation || msg.message.extendedTextMessage?.text

    if (!body) return

    // Command: .tr <lang_code> <text>
    if (body.startsWith('.tr ')) {
      const args = body.split(' ')
      const lang = args[1]
      const text = args.slice(2).join(' ')

      if (!lang || !text) {
        await sock.sendMessage(from, {
          text: '❌ Usage: .tr <lang_code> <text>\nExample: .tr si Hello',
        })
        return
      }

      try {
        const res = await translate(text, { to: lang })
        await sock.sendMessage(from, { text: res.text })
      } catch (e) {
        await sock.sendMessage(from, { text: '❌ Translation Error!' })
      }
    }
  })
}

startBot()

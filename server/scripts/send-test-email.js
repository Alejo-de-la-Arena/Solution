/**
 * Uso: node scripts/send-test-email.js tu@email.com
 * Envía un correo de prueba vía Resend usando .env del server.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const to = (process.argv[2] || '').trim();
const key = (process.env.RESEND_API_KEY || '').trim();
const from = (process.env.RESEND_FROM_EMAIL || '').trim();

if (!to) {
  console.error('Uso: node scripts/send-test-email.js tu@email.com');
  process.exit(1);
}
if (!key || !from) {
  console.error('Falta RESEND_API_KEY o RESEND_FROM_EMAIL en .env');
  process.exit(1);
}

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to,
    subject: 'Prueba Resend — Solution',
    html: '<p>Si ves esto, Resend y el remitente están OK.</p>',
  }),
})
  .then(async (r) => {
    const body = await r.json().catch(() => ({}));
    console.log('HTTP', r.status, body);
    if (!r.ok) process.exit(1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

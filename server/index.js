const path = require('path');
// Siempre cargar .env junto a este archivo (evita 0 variables cuando el cwd no es server/)
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
// Railway (y Docker) enrutan al contenedor por PORT; hay que escuchar en todas las interfaces.
const port = Number(process.env.PORT) || 3000;

const naveEnv = (process.env.NAVE_ENV || 'testing').toLowerCase();
const naveAuthIsProd = naveEnv === 'production' || naveEnv === 'prod';
console.log('[boot] Nave M2M:', {
  NAVE_ENV: naveEnv,
  auth: naveAuthIsProd ? 'production' : 'homologacion',
  hasClientId: Boolean((process.env.NAVE_CLIENT_ID || '').trim()),
  hasClientSecret: Boolean((process.env.NAVE_CLIENT_SECRET || '').trim()),
  hasAudience: Boolean((process.env.NAVE_AUDIENCE || '').trim()),
});

// Middleware
app.use(morgan('dev'));
app.use(cors({ origin: true }));

// Routes (naveRouter antes de express.json: el webhook debe leer el body aunque el Content-Type no sea application/json)
const gestionarRouter = require('./routes/gestionar');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');
const naveRouter = require('./routes/nave');
const correoRouter = require('./routes/correo');
const shippingRouter = require('./routes/shipping');

/**
 * Nave POSTea el webhook; si el Content-Type no es exactamente JSON, express.json() deja req.body vacío.
 * Parseamos texto crudo antes del JSON global para no perder payment_id / external_payment_id.
 */
const NAVE_WEBHOOK_LIMIT = '512kb';
app.post(
  '/webhooks/nave',
  express.raw({ type: () => true, limit: NAVE_WEBHOOK_LIMIT }),
  (req, res, next) => {
    try {
      const raw = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');
      req.naveWebhookRawLength = raw.length;
      req.body = raw.trim() ? JSON.parse(raw) : {};
    } catch (e) {
      req.body = {};
      req.naveWebhookJsonError = e.message;
    }
    naveRouter.handleNaveWebhook(req, res, next);
  },
);
// Health check: verificar en Nave / DNS que esta URL pública llega al backend (no al front estático)
app.get('/webhooks/nave', (_req, res) => {
  res.status(200).type('text/plain').send('nave webhook ok');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/gestionar', gestionarRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);
app.use('/api', naveRouter);
app.use('/api/correo', correoRouter);
app.use('/api/shipping', shippingRouter);

app.get('/', (req, res) => {
  res.send('Hello World!!');
});

// Catch-all: log any unmatched request so we can see what path Nave is actually hitting
app.use((req, res, _next) => {
  console.warn('[404]', req.method, req.originalUrl, '— body:', JSON.stringify(req.body));
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Start server (0.0.0.0: evita "connection refused" detrás del proxy de Railway)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${port}`);
});
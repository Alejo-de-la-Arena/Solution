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
const serverPublicUrl = (process.env.SERVER_PUBLIC_URL || '').replace(/\/+$/, '');
console.log('[boot] Nave M2M:', {
  NAVE_ENV: naveEnv,
  auth: naveAuthIsProd ? 'production' : 'homologacion',
  hasClientId: Boolean((process.env.NAVE_CLIENT_ID || '').trim()),
  hasClientSecret: Boolean((process.env.NAVE_CLIENT_SECRET || '').trim()),
  hasAudience: Boolean((process.env.NAVE_AUDIENCE || '').trim()),
  webhookUrl: serverPublicUrl
    ? `${serverPublicUrl}/api/nave/webhook`
    : '⚠️  SERVER_PUBLIC_URL no definida — el webhook de Nave no funcionará',
});

// Middleware
app.use(morgan('dev'));
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const gestionarRouter = require('./routes/gestionar');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');
const naveRouter = require('./routes/nave');
const correoRouter = require('./routes/correo');

app.use('/api/gestionar', gestionarRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);
app.use('/api', naveRouter);
app.use('/api/correo', correoRouter);

app.get('/', (req, res) => {
  res.send('Hello World!!');
});

// Start server (0.0.0.0: evita "connection refused" detrás del proxy de Railway)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${port}`);
});

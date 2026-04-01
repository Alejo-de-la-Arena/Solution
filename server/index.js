const path = require('path');
// Siempre cargar .env junto a este archivo (evita 0 variables cuando el cwd no es server/)
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const gestionarRouter = require('./routes/gestionar');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');
const naveRouter = require('./routes/nave');
app.use('/api', gestionarRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);
app.use('/api', naveRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

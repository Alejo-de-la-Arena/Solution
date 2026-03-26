require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

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
  res.send('Hello World!');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const express = require('express');
const path = require('path');
const submitHandler = require('./api/submit'); // Import handler dari folder api
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Hubungkan endpoint /api/submit ke file handler
app.post('/api/submit', submitHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', proxy('http://localhost:5050'));
app.use('/', proxy('http://localhost:6060'));
app.use('/order', proxy('http://localhost:7070'));

app.listen(5000, () => {
  console.log('api gateway tai port 5000');
});

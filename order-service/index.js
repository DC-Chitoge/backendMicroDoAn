import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import orderRouter from './orderRoutes.js';
import uploadRouter from './uploadRoutes.js';

dotenv.config();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to database');
  })
  .catch((error) => {
    console.log(error.message);
  });

const app = express();
//User
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//
app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});

//USer
app.use('/api/orders', orderRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 7070;
app.listen(port, () => {
  console.log(`server is already to use tai port ${port}`);
});

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './seedRoutes.js';
import productRouter from './productRoutes.js';
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
app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/upload', uploadRouter);

//USer

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 6060;
app.listen(port, () => {
  console.log(`server is already to use tai port ${port}`);
});

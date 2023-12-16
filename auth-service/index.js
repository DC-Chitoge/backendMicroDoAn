import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './seedRoutes.js';
import userRouter from './userRoutes.js';

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

//USer
app.use('/api/users', userRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`auth-server is already to use tai port ${port}`);
});

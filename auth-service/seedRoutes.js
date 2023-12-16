import express from 'express';
import data from './data.js';
import User from './userModel.js';

const seedRouter = express.Router();

seedRouter.get('/', async (req, res) => {
  //USer
  await User.deleteMany({});
  const createdUsers = await User.insertMany(data.users);
  res.send({ createdUsers });
});
export default seedRouter;

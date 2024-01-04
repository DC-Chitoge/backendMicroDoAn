import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from './orderModel.js';
// import User from './userModel.js';
// import Product from './productModel.js';
import { isAuth, isAdmin } from './utils.js';
import amqp from 'amqplib';
// import { publishMessage, consumeMessage } from './messageBroker.js';

const amqpserver =
  'amqps://psavqxur:Wi_ATNNJ0v5rq-6fIoQlAKWQMYlfO5IG@octopus.rmq3.cloudamqp.com/psavqxur';
//connect amqp
var channel, connection;
// async function connect_amqp() {
// connection = await amqp.connect(amqpserver);
// channel = await connection.createChannel();
// await channel.assertQueue('orders');
// }
// connect_amqp().then(() => {
//   channel.consume('ORDER_PRODUCT', (data) => {
//     console.log('co nguoi mua hang r anh em', JSON.parse(data.content));
//   });
// });
const orderRouter = express.Router();
orderRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate('user', 'name');
    res.send(orders);
  })
);

orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      connection = await amqp.connect(amqpserver);
      console.log('connected to rabbitMq');
      channel = await connection.createChannel();
      await channel.assertQueue('orders');
      channel.consume('orders', async (data) => {
        console.log('da nhan duoc hang!');
        const { products, email, orderId } = JSON.parse(data.content);
        const newOrder = new Order({
          orderItems: products.map((product) => ({
            product: {
              name: product.name,
              slug: product.slug,
              image: product.image,
              brand: product.brand,
              category: product.category,
              description: product.description,
              price: product.price,
              countInStock: product.countInStock,
              rating: product.rating,
              numReviews: product.numReviews,
            },
            quantity: product.quantity, // Assuming you have quantity information in your product data
          })),
          email: email, // Assuming user._id is the reference to the user in your database
          orderId: orderId, // Set the order ID from the queue
        });
        const order = await newOrder.save();
        res.status(201).send({ message: 'New Order Created', order });
        const {
          email: savedEmail,
          products: savedProducts,
          totalPrice,
        } = newOrder.toJSON();
        channel.sendToQueue(
          'products',
          Buffer.from(
            JSON.stringify({
              orderId,
              email: savedEmail,
              products: savedProducts,
              totalPrice,
            })
          )
        );
      });
    } catch (error) {}
  })
);
orderRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);
orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: 'Order Delivered' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);
orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.send({ message: 'Order Paid', order: updatedOrder });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);
orderRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.send({ message: 'Order Deleted' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

export default orderRouter;

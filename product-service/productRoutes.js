import express from 'express';
import Product from './productModel.js';
import expressAsyncHandler from 'express-async-handler';
const productRouter = express.Router();
import { isAuth, isAdmin } from './utils.js';
import amqp from 'amqplib';

const amqpserver =
  'amqps://psavqxur:Wi_ATNNJ0v5rq-6fIoQlAKWQMYlfO5IG@octopus.rmq3.cloudamqp.com/psavqxur';
//connect amqp
var channel, connection;
async function connect_amqp() {
  connection = await amqp.connect(amqpserver);
  channel = await connection.createChannel();
  await channel.assertQueue('BUY_PRODUCT');
}
connect_amqp();

productRouter.get('/', async (req, res) => {
  const products = await Product.find();
  res.send(products);
});
productRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({
      name: 'fill out name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/p1.jpg',
      price: 0,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const product = await newProduct.save();
    res.send({ message: 'Product Created', product });
    //   const {
    //     name,
    //     slug,
    //     image,
    //     price,
    //     category,
    //     brand,
    //     countInStock,
    //     rating,
    //     numReviews,
    //     description,
    //   } = req.body;

    //   try {
    //     const newProduct = new Product({
    //       name,
    //       slug,
    //       image,
    //       price,
    //       category,
    //       brand,
    //       countInStock,
    //       rating,
    //       numReviews,
    //       description,
    //     });

    //     const product = await newProduct.save();

    //     res.send({ message: 'Product Created', product });
    //   } catch (error) {
    //     return res
    //       .status(500)
    //       .json({ message: 'Internal Server Error', error: error.message });
    //   }
  })
);
productRouter.post(
  '/buy',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //ids is Array[id1,id2] vì khách hàng có thể mua nhiều thứ
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.json({
        message: 'is array',
      });
    }
    //tìm kiếm sản phẩm trong product mongodb
    const products = await Product.find({
      //$ in la toan tu tim kiem cua mongodb
      _id: { $in: ids },
    });
    //day qua order service
    channel.sendToQueue(
      'ORDER_PRODUCT',
      Buffer.from(
        JSON.stringify({
          products,
          email: req.user.email,
        })
      )
    );
    return res.json({ message: products });
  })
);
productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.image = req.body.image;
      product.images = req.body.images;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();
      res.send({ message: 'Product Updated' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);
productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.send({ message: 'Product Deleted' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 3;
productRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments();
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? {
            // 1-50
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);
productRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

productRouter.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: { $eq: req.params.slug } });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
productRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

export default productRouter;

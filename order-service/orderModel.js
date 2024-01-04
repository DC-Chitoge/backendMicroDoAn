import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    orderItems: [
      {
        product: {
          name: { type: String, required: true, unique: true },
          slug: { type: String, required: true, unique: true },
          image: { type: String, required: true },
          images: [String],
          brand: { type: String, required: true },
          category: { type: String, required: true },
          description: { type: String, required: true },
          price: { type: Number, required: true },
          countInStock: { type: Number, required: true },
          rating: { type: Number, required: true },
          numReviews: { type: Number, required: true },
        },
        quantity: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    email: { type: String, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;

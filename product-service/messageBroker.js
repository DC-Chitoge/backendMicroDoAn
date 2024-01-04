import amqp from 'amqplib';
let messageBrokerChannel = null;

async function connectToRabbitMQ() {
  console.log('Connecting to RabbitMQ...');

  try {
    const connection = await amqp.connect(
      'amqps://psavqxur:Wi_ATNNJ0v5rq-6fIoQlAKWQMYlfO5IG@octopus.rmq3.cloudamqp.com/psavqxur'
    );
    const channel = await connection.createChannel();
    await channel.assertQueue('products');
    console.log('RabbitMQ connected');
    return channel;
  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err.message);
    return null;
  }
}

async function initializeMessageBroker() {
  messageBrokerChannel = await connectToRabbitMQ();
}

export async function publishMessage(queue, message) {
  if (!messageBrokerChannel) {
    console.error('No RabbitMQ channel available.');
    return;
  }

  try {
    await messageBrokerChannel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message))
    );
  } catch (err) {
    console.log(err);
  }
}

export async function consumeMessage(queue, callback) {
  if (!messageBrokerChannel) {
    console.error('No RabbitMQ channel available.');
    return;
  }

  try {
    await messageBrokerChannel.consume(queue, (message) => {
      const content = message.content.toString();
      const parsedContent = JSON.parse(content);
      callback(parsedContent);
      messageBrokerChannel.ack(message);
    });
  } catch (err) {
    console.log(err);
  }
}

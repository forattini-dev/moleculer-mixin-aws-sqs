const AWS = require("aws-sdk");
const https = require("https");
const { Consumer } = require("sqs-consumer");

module.exports = {
  name: "aws-sqs",

  settings: {
    aws: {
      region: "us-east-1",
      accessKeyId: null,
      secretAccessKey: null,

      sqs: {
        prefetch: 20,
        clientConfig: {},
        consumerConfig: {},
      },
    },
  },

  queues: {},

  created() {
    const {
      aws: {
        region,
        accessKeyId,
        secretAccessKey,
        sqs: { clientConfig },
      },
    } = this.settings;

    AWS.config.update({
      region,
      accessKeyId,
      secretAccessKey,
    });

    this.activeQueues = {};

    this.awsSqsClient = new AWS.SQS({
      ...clientConfig,
      
      httpOptions: {
        agent: new https.Agent({
          keepAlive: true,
        }),
      },
    });
  },

  async started() {
    const {
      aws: {
        sqs: { prefetch, consumerConfig },
      },
    } = this.settings;

    Object.entries(this.schema.queues)
      .forEach(([key, value]) => {
        this.activeQueues[key] = new Array(prefetch < 10 ? 1 : Math.ceil(prefetch/10))
          .fill(0)
          .map(() => {
            let consumer = Consumer.create({
              queueUrl: key,
              batchSize: 10,
              sqs: this.awsSqsClient,
              handleMessage: value.bind(this),
              visibilityTimeout: 2 * 60,
              ...consumerConfig,
            });

            consumer = this.setupEvents(consumer);
            consumer.start();
          })
      });
  },

  actions: {

    sendMessage: {
      params: {
        queue: 'string',
        body: 'string',
        options: 'object',
      },

      async handler (ctx) {
        const { queue, body, options } = ctx.params

        const params = {
         DelaySeconds: 2,
         MessageBody: body,
         QueueUrl: queue,
         ...options
       }

       return this.awsSqsClient.sendMessage(params).promise()
      }
    },
    
  },

  methods: {
    setupEvents(consumer) {
      consumer.on("empty", () => this.logger.warn(`SQS is empty`));
      consumer.on("error", (err) => this.logger.error(`SQS error`, err));
      consumer.on("timeout_error", (err) => this.logger.error(`SQS timeout`, err));
      consumer.on("processing_error", (err) => this.logger.error(`SQS processing error`, err));

      consumer.on("stopped", () => {
        this.logger.warn(`SQS stopped`);
        consumer.start();
      });

      return consumer;
    },
  },
};

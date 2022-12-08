# moleculer-mixin-aws-sqs

## Install

```bash
$ npm install moleculer-mixin-aws-sqs
# or
$ yarn add moleculer-mixin-aws-sqs
```

## Config

```javascript
const AwsSqs = require("moleculer-mixin-aws-sqs");

const {
  AWS_SECRET_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env

module.exports = {
  name: 'aws-sqs'
  mixins: [AwsSqs],

  settings: {
    aws: {
      // credentials
      accessKeyId: AWS_SECRET_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,

      // region
      region: "us-east-1", // default

      sqs: {
        prefetch: 5, // default

        // configs you may want to pass to AWS.SQS
        clientConfig: {},

        // configs you may want to pass to sqs-consumer
        consumerConfig: {
          visibilityTimeout: 2 * 60, // default, in seconds
        },
      },
    },
  },
};
```

## Usage

### Consumer

```javascript
// consumer.service.js
const SqsMixin = require("../mixins/aws-sqs.mixin");

const {
  AWS_SQS_LEADS_NEW = "https://sqs.region.amazonaws.com/accountid/leads_new",
} = process.env;

module.exports = {
  name: "leads-queue",
  mixins: [SqsMixin],

  settings: {
    aws: {
      sqs: {
        prefetch: 45,
      },
    },
  },

  queues: {
    async [AWS_SQS_LEADS_NEW](message) {
      let { Body } = message;
      const MessageBody = JSON.parse(Body);
      await this.broker.call("leads.create", MessageBody);
    },
  },

  actions: {
    async newLead(ctx) {
      await this.actions.sendMessage({
        queue: AWS_SQS_LEADS_NEW,
        body: JSON.stringify(ctx.params),
      });
    },
  },
};
```

### Producer

```javascript
// producer.service.js
module.exports = {
  name: "producer",

  actions: {
    async createNewLead(ctx) {
      await ctx.call("leads-queue.newLead", {
        a: 1,
        b: "2",
        c: true,
      });
    },
  },
};
```

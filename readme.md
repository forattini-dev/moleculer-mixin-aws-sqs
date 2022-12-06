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
        prefetch: 20, // default

        // configs you may want to pass to AWS.SQS
        clientConfig: {},

        // configs you may want to pass to sqs-consumer
        consumerConfig: {
          visibilityTimeout: 2 * 60, // default
        },
      },
    },
  },
};
```

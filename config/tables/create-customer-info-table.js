var AWS = require("aws-sdk");
const config = require("../config");
AWS.config.update(config.aws_remote_config);

var dynamodb = new AWS.DynamoDB();
var params = {
  TableName: config.aws_table_name,
  KeySchema: [
    {
      AttributeName: "orderId",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "orderId",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};
dynamodb.createTable(params, function (err, data) {
  if (err) {
    console.error("Error JSON.", JSON.stringify(err, null, 2));
  } else {
    console.log("Created table.", JSON.stringify(data, null, 2));
  }
});

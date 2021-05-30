const AWS = require("aws-sdk");
const config = require("../../config/config");

const isTest = process.env.NODE_ENV === "test";

if (isTest) {
  AWS.config.update(config.aws_remote_config);
  config.aws_table_name = "customer-info-test";
}

var docClient = new AWS.DynamoDB.DocumentClient();

// GET customer Notifications
const getCustomersInfo = async () => {
  var params = {
    TableName: config.aws_table_name,
    SELECT: "ALL_ATTRIBUTES",
  };

  const customers = await docClient.scan(params).promise();
  customers.Items.sort(custom_sort);
  return customers;
};
// sorting based on updated_at
function custom_sort(a, b) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

// Search Customer by orderId
const getCustomer = async (search) => {
  var params = {
    TableName: config.aws_table_name,
    FilterExpression: "contains(#id, :order_id)",
    ExpressionAttributeNames: {
      "#id": "orderId",
    },
    ExpressionAttributeValues: {
      ":order_id": search,
    },
  };
  const customer = await docClient.scan(params).promise();
  return customer;
};

module.exports = { getCustomersInfo, getCustomer };

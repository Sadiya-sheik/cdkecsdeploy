const AWS = require("aws-sdk");
const config = require("../config");
var fs = require("fs");

AWS.config.update(config.aws_remote_config);

var docClient = new AWS.DynamoDB.DocumentClient();
console.log("Importing customer data into DynamoDB. Please wait.");
var customers = JSON.parse(
  fs.readFileSync(
    "C:\\Users\\sadiya.sheikh\\Admin-module\\AcertusAdminPortal\\config\\tables\\customer-info.json",
    "utf8"
  )
);

customers.forEach(function (customer) {
  var params = {
    TableName: config.aws_table_name,
    Item: {
      _id: customer._id,
      customerId: customer.customerId,
      customerFirstname: customer.customerFirstname,
      customerLastname: customer.customerLastname,
      notificationDateTime: customer.notificationDateTime,
      dealerName: customer.dealerName,
      orderId: customer.orderId,
      orderStatus: customer.orderStatus,
      notificationStatus: customer.notificationStatus,
      optStatus: customer.optStatus,
      messageStatus: customer.messageStatus,
      message: customer.message,
      estimatedArrival: customer.estimatedArrival,
      updated_at: customer.updated_at,
      created_at: customer.created_at,
      region: customer.region,
      deviceType: customer.deviceType,
      responseTime: customer.responseTime,
      clickDateTime: customer.clickDateTime,
    },
  };
  docClient.put(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to add Customer",
        params.Item.customerFirstname,
        ". Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("PutItem succeeded:", params.Item.customerFirstname);
    }
  });
});
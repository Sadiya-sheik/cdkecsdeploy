const AWS = require("aws-sdk");
const config = require("../../config/config");

const isTest = process.env.NODE_ENV === "test";

if (isTest) {
  AWS.config.update(config.aws_remote_config);
  config.aws_table_name = "customer-info-test";
}

var docClient = new AWS.DynamoDB.DocumentClient();

// GET customers analytics data
const getAnalyticsInfo = async (page, limit) => {
  var params = {
    TableName: config.aws_table_name,
    ProjectionExpression:
      "#_id, #customerName, #orderId, #orderStatus, #region, #deviceType, #responseTime, #dateTime, #updated_at, #created_at",
    ExpressionAttributeNames: {
      "#_id": "_id",
      "#customerName": "customerName",
      "#orderId": "orderId",
      "#orderStatus": "orderStatus",
      "#region": "region",
      "#deviceType": "deviceType",
      "#responseTime": "responseTime",
      "#dateTime": "dateTime",
      "#updated_at": "updated_at",
      "#created_at": "created_at",
    },
  };

  const analyticsData = await docClient.scan(params).promise();
  analyticsData.Items.sort(custom_sort);
  return analyticsData;
};
// sorting the data based on dateTime
function custom_sort(a, b) {
  return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
}

module.exports = getAnalyticsInfo;

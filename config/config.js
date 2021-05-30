module.exports = {
  aws_table_name: "CustomerNotifications",
  aws_local_config: {
    region: "local",
    endpoint: "http://localhost:8000",
  },
  aws_remote_config: {
    region: "ap-south-1",
    endpoint: "dynamodb.ap-south-1.amazonaws.com",
  },
};

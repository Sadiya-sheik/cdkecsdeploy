const express = require("express");
const AWS = require("aws-sdk");
//const cors = require("cors");

const config = require("../config/config");
AWS.config.update(config.aws_remote_config);
const adminRouter = require("./routers/admin.routes");
const analyticRouter = require("./routers/analytics.routes");

const app = express();
app.use(adminRouter);
app.use(analyticRouter);

module.exports = app;

const express = require("express");
const getAnalyticsInfo = require("../controllers/analytics.controller");
const router = new express.Router();
const cors = require("cors");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 60 });

//Endpoint point to GET analytics data
router.get("/analytics", cors(), async (req, res) => {
  try {
    if (myCache.has("analyticsData")) {
      res.status(200).json(myCache.get("analyticsData"));
    } else {
      const analyticsData = await getAnalyticsInfo();
      myCache.set("analyticsData", analyticsData);
      res.status(200).json(analyticsData);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Something went wrong" });
  }
});

module.exports = router;

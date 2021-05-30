const express = require("express");
const {
  getCustomersInfo,
  getCustomer,
} = require("../controllers/admin.controllers");
const router = new express.Router();
const cors = require("cors");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 60 });

// Endpoint to GET customer Notifications and OptIn/OptOut status
router.get("/customers", cors(), async (req, res) => {
  try {
    if (myCache.has("customers")) {
      res.status(200).json(myCache.get("customers"));
    } else {
      const customers = await getCustomersInfo();
      myCache.set("customers", customers);
      res.status(200).json(customers);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Something went wrong" });
  }
});

//Endpoint to GET customer by orderId
router.get("/customer", cors(), async (req, res) => {
  try {
      const customer = await getCustomer(req.query.search);
      res.status(200).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Something went wrong" });
  }
});

module.exports = router;

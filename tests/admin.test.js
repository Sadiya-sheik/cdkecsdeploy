const request = require("supertest");
const app = require("../src/app");

test("Should fetch customers", async () => {
  const response = await request(app).get("/customers").send().expect(200);
  expect(response.body.Items.length).toEqual(1);
});

test("Should fetch customers", async () => {
  const response = await request(app).get("/analytics").send().expect(200);
  expect(response.body.Items.length).toEqual(1);
});

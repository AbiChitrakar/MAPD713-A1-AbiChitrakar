let SERVER_NAME = "product-api";
let PORT = 3000;
let HOST = "127.0.0.1";

let errors = require("restify-errors");
let restify = require("restify");

let productsSave = require("save")("products");
// Create the restify server
let server = restify.createServer({ name: SERVER_NAME });

// Initialize request counters
let getRequestCount = 0;
let postRequestCount = 0;

server.listen(PORT, HOST, function () {
  console.log("Server %s listening at %s", server.name, server.url);
  console.log("**** Resources: ****");
  console.log("********************");
  console.log(" /products");
  console.log(" /products/:id");
  if (server.router && server.router.mounts) {
    server.router.mounts.forEach((route) => {
      console.log(
        `${route.spec.path} method: ${Object.keys(route.route.methods).join(
          ", "
        )}`
      );
    });
  }
});

server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

// Middleware for logging requests and responses and updating request counters
server.use(function (req, res, next) {
  console.log(`> ${req.route.path} ${req.method}: received request`);
  // Update request counters
  if (req.method === "GET") {
    getRequestCount++;
  } else if (req.method === "POST") {
    postRequestCount++;
  }
  console.log(
    `Processed Request Count--> Get: ${getRequestCount}, Post: ${postRequestCount}`
  );

  res.once("finish", function () {
    console.log(`< ${req.route.path} ${req.method}: sending response`);
  });
  next();
});

server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

// Sample product data (initially empty)
let products = [];

// GET: Retrieve all products
server.get("/products", function (req, res, next) {
  console.log("GET /products params=>" + JSON.stringify(req.params));

  productsSave.find({}, function (error, products) {
    // Return all of the products in the system
    res.send(products);
  });
});

// GET: Retrieve a single product by its ID
server.get("/products/:_id", function (req, res, next) {
  console.log("GET /products/:id params=>" + JSON.stringify(req.params));

  productsSave.findOne({ _id: req.params._id }, function (error, product) {
    // If there are any errors, pass them to next in the correct format
    if (error) return next(new Error(JSON.stringify(error.errors)));

    if (product) {
      // Send the product if no issues
      res.send(product);
    } else {
      // Send 404 header if the product doesn't exist
      res.send(404);
    }
  });
});

// POST: Create a new product
server.post("/products", function (req, res, next) {
  console.log("POST /products params=>" + JSON.stringify(req.params));
  console.log("POST /products body=>" + JSON.stringify(req.body));

  // Validation of mandatory fields
  if (
    req.body.name === undefined ||
    req.body.price === undefined ||
    req.body.quantity === undefined
  ) {
    // If there are any errors, pass them to next in the correct format
    return next(
      new errors.BadRequestError("Name, Price, and Quantity must be supplied")
    );
  }

  let newProduct = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
  };

  productsSave.create(newProduct, function (error, product) {
    // If there are any errors, pass them to next in the correct format
    if (error) return next(new Error(JSON.stringify(error.errors)));

    // Send the product if no issues
    res.send(201, product);
  });
});

// DELETE: Delete a product by its ID
server.del("/products/:id", function (req, res, next) {
  console.log("DELETE /products params=>" + JSON.stringify(req.params));

  // Delete the product
  productsSave.delete(req.params.id, function (error, product) {
    // If there are any errors, pass them to next in the correct format
    if (error) return next(new Error(JSON.stringify(error.errors)));

    // Send a 204 response (No Content) if successful
    res.send(204);
  });

  // DELETE: Delete all products
  server.del("/products", function (req, res, next) {
    console.log("DELETE /products");

    // Delete all products
    productsSave.delete({}, function (error) {
      // If there are any errors, pass them to next in the correct format
      if (error) {
        console.error(
          `Error in DELETE /products: ${JSON.stringify(error.errors)}`
        );
        return next(new Error(JSON.stringify(error.errors)));
      }
      res.send(204);
    });
  });
});

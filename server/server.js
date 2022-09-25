const PROTO_PATH = "./restaurant.proto";

var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

require("dotenv").config({ path: "./server/config.env" });
const Menu = require("./models/Menu");

const express = require("express");
const app = express();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

app.use(express.json());

server.addService(restaurantProto.RestaurantService.service, {
  getAllMenu: async (_, callback) => {
    const menu = await Menu.find();
    callback(null, { menu });
  },
  get: async (call, callback) => {
    let menuItem = await Menu.findById(call.request.id);

    if (menuItem) {
      callback(null, menuItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
  insert: async (call, callback) => {
    let menuItem = new Menu(call.request);
    const newMenuItem = await menuItem.save();
    callback(null, newMenuItem);
  },
  update: async (call, callback) => {
    let existingMenuItem = await Menu.findById(call.request.id);

    if (existingMenuItem) {
      existingMenuItem.name = call.request.name;
      existingMenuItem.price = call.request.price;
      const updatedMenuItem = await existingMenuItem.save();
      callback(null, updatedMenuItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not Found",
      });
    }
  },
  remove: async (call, callback) => {
    let existingMenuItem = await Menu.findById(call.request.id);

    if (existingMenuItem) {
      await existingMenuItem.remove();
      callback(null, {});
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "NOT Found",
      });
    }
  },
});

server.bind("127.0.0.1:30043", grpc.ServerCredentials.createInsecure());
console.log("Server running at http://127.0.0.1:30043");
server.start();

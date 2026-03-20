var mongoose = require("mongoose"),
  config = require("./config"),
  models = require("./models");

module.exports = () =>
  new Promise((resolve, reject) => {
    console.log(`Connecting to local MongoDB at: ${config.db}`);
    
    mongoose.connect(config.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully to local database.");
      models.map((model) => require(`../models/${model}.model`));
      resolve();
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected.");
    });

    mongoose.connection.on("error", function (err) {
      console.log(`Mongoose connection error: ${err}`);
      console.log("Make sure MongoDB is running locally on port 27017");
      reject(err);
    });
  });

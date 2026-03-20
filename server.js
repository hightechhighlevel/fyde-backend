const chalk = require('chalk');

process.env.NODE_ENV = process.env.NODE_ENV || "development";

var express = require("./config/express"),
    mongoose = require("./config/mongoose"),
    config = require("./config/config"),
    http = require("http");

mongoose().then(() => {
    var app = express();
    var server = http.createServer(app);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'OK', message: 'Fyde Mini App Backend is running' });
    });
    
    // Catch all for invalid endpoints - should be last
    app.all('*', (req, res) => {
        res.status(404).json({ error: 'Invalid Endpoint', path: req.path });
    });
    
    server.listen(config.port, () => {
        console.log(`Server is running at http://localhost:${config.port}`)
    });
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});
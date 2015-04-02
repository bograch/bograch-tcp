'use strict';

var util = require('util');
var ServerTransport = require('bograch-transport').ServerTransport;
var net = require('net');
var JsonSocket = require('json-socket');

function TcpServerTransport(options) {
  ServerTransport.call(this);
  
  options = options || {};
  if (!options.port) {
    throw new Error('port was not passed to TcpServerTransport');
  }
  this._port = options.port;
  this._methods = {};
}

util.inherits(TcpServerTransport, ServerTransport);

TcpServerTransport.prototype.on = function (methodName, cb) {
  this._methods[methodName] = cb;
};

TcpServerTransport.prototype.start = function (cb) {
  var server = net.createServer();
  server.listen(this._port);
  server.on('connection', function(socket) {
    this._socket = new JsonSocket(socket);
    this._socket.on('message', function(message) {
      if (message && message.methodName && this._methods[message.methodName]) {
        var method = this._methods[message.methodName];
        method(message.args, function () {
          if (message.callbackId) {
            this._socket.sendMessage({
              args: Array.prototype.slice.call(arguments),
              callbackId: message.callbackId
            });
          }
        }.bind(this));
      }
    }.bind(this));
    cb();
  }.bind(this));
};

TcpServerTransport.prototype.end = function () {
  if (this._socket) {
    this._socket.end();
  }
};

module.exports = TcpServerTransport;
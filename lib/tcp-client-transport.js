'use strict';

var util = require('util');
var ClientTransport = require('bograch-transport').ClientTransport;
var net = require('net');
var JsonSocket = require('json-socket');
var CallbackStore = require('callback-store');

function TcpClientTransport(options) {
  ClientTransport.call(this);
  
  options = options || {};
  if (!options.port) {
    throw new Error('port was not passed to TcpClientTransport');
  }
  if (!options.host) {
    throw new Error('host was not passed to TcpClientTransport');
  }
  this._port = options.port;
  this._host = options.host;
  this._callbackStore = new CallbackStore({
    ttl: options.ttl
  });
}

util.inherits(TcpClientTransport, ClientTransport);

TcpClientTransport.prototype.connect = function (cb) {
  this._socket = new JsonSocket(new net.Socket());
  this._socket.connect(this._port, this._host);
  this._socket.on('connect', function () {
    this._onConnect();
    cb();
  }.bind(this));
};

TcpClientTransport.prototype.end = function () {
  this._callbackStore.releaseAll();
  this._socket.end();
};

TcpClientTransport.prototype._onConnect = function () {
  this._socket.on('message', function(message) {
    if (!message || !message.callbackId) {
      console.log('Invalid response received');
      return;
    }
    var cb = this._callbackStore.get(message.callbackId);
    if (cb) {
      cb(message.args);
    }
  }.bind(this));
};

TcpClientTransport.prototype.call = function (methodName, args, cb) {
  var cId = this._callbackStore.add(cb);
  var message = {
    methodName: methodName,
    args: args,
    callbackId: cId
  };
  this._socket.sendMessage(message);
};

module.exports = TcpClientTransport;
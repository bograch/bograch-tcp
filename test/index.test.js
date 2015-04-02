'use strict';

var expect = require('chai').expect;
var tcp = require('../lib');
var ClientTransport = tcp.ClientTransport;
var ServerTransport = tcp.ServerTransport;

var options = {
  port: 7461,
  host: '127.0.0.1',
  ttl: 5000
};
var client = new ClientTransport(options);
var server = new ServerTransport(options);

describe('Transport', function () {
  it('should send and receive message', function (done) {
    server.on('foo', function (args, cb) {
      expect(args).to.be.equal('argsToServer');
      cb('argsToClient');
    });
    
    server.start(function () {
    });
    
    client.connect(function () {
        client.call('foo', 'argsToServer', function (args) {
          expect(args[0]).to.be.equal('argsToClient');
          done();
        });
      });
  });
});
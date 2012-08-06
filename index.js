var cluster = require('cluster'),
    events = require('events'),
    util = require('util'),
    numCPUs = require('os').cpus().length;

function ClusterFork() {

  function Emitted() {
    events.EventEmitter.call(this);
    this.pid = process.pid;
  }
  util.inherits(Emitted, events.EventEmitter);

  function Master() {
    var workerIndex = -1;

    var emitted = new Emitted();
    Object.defineProperty(emitted, 'isMaster', { value: true, writable: false });

    this.Schemes = {
      RoundRobin: function() {
        workerIndex++;
        if (workerIndex >= Object.keys(cluster.workers).length) {
          workerIndex = 0;
        }

        return Object.keys(cluster.workers)[workerIndex];
      },

      Random: function() {
        return Math.floor(Math.random() * Object.keys(cluster.workers).length);
      }
    };

    var scheme = this.Schemes.RoundRobin;

    this.requestWorker = function() {
      var workerId = scheme();
      return cluster.workers[workerId];
    };

    emitted.suicide = function(cb) {
      cluster.disconnect(function() {
        cb();
      });
    };

    Object.defineProperty(emitted, 'nextWorker', { get: this.requestWorker });
    Object.defineProperty(emitted, 'numWorkers', { value: numCPUs, writable: false });

    this.ready = function(numWorkers) {
      emitted.emit('workersReady', numWorkers);
    }

    this.handler = function(msg) {
      switch (msg.status) {
        case 'processed':
          emitted.emit('processed', msg.pid, msg.data);
          break;
        case 'worker_log':
          console.log('Worker ' + msg.pid + ': ' + util.inspect(msg.data, false, 4));
          break;
        case 'error':
          emitted.emit('error', msg.data);
          break;
      }
    };

    this.start = function(master_cb, worker_cb) {
      process.nextTick(function() {
        master_cb(emitted);        
      })
    };
  }

  function Worker() {
    var emitted = new Emitted();
    Object.defineProperty(emitted, 'isMaster', { value: false, writable: false });

    var workerDone = function(data) {
      process.send({ status: 'processed', pid: process.pid, data: data })
    };

    emitted.log = function(msg) {
      process.send({ status: 'worker_log', pid: process.pid, data: msg });
    };

    this.start = function(master_cb, worker_cb) {
      worker_cb(emitted, workerDone);
    };

    process.on('message', function(data) {
      emitted.emit('message', data);
    })
  };

  var instance;
  if (cluster.isMaster) {
    instance = new Master();
  } else {
    instance = new Worker();
  }

  return instance;
}

var clusterFork = new ClusterFork();

if (cluster.isMaster) {
  cluster.setupMaster({
    exec: process.mainModule.filename
  });

  var numWorkers = 0;
  cluster.on('fork', function() {
    numWorkers++;
    numWorkers == numCPUs && clusterFork.ready(numWorkers);
  });

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  Object.keys(cluster.workers).forEach(function(id) {
    cluster.workers[id].on('message', clusterFork.handler);
  });
}

module.exports = clusterFork;

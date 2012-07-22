var clusterFork = require('../index'),
    assert = require('assert');

clusterFork.start(function(master) {
  var done = false;

  assert(master.isMaster)

  var numCPUs = require('os').cpus().length;
  assert(master.numWorkers, numCPUs);

  var total = 0;
  master.on('processed', function(pid, data) {
    total++;
    if (total == master.numWorkers) {
      assert(data.value, 42);
      done = true;
    }
  });

  for (var i = 0; i < master.numWorkers; i++) {
    master.nextWorker.send({ value: 21 });    
  }

  var checkDone = function() {
    if (done) {
      console.log('Tests passed')
      process.exit(0);
    } else {
      process.nextTick(checkDone);
    }
  }

  checkDone();
}, function(worker, done) {
  assert.notEqual(worker.isMaster, true);

  worker.on('message', function(data) {
    assert.equal(data.value, 21);
    done({ value: data.value*2 });
  });
  // console.log('I am worker! ' + worker.pid + ' master?' + worker.isMaster)
  // console.log(worker)
  // worker.on('message', function(data) {
  //   console.log('me ' + worker.pid + ' data ' + data.look);
  // })
  // setInterval(function() {
  //   done({ result: Math.random() });
  // }, 4000)
})

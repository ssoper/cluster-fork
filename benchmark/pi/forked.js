var clusterFork = require('../../index');

clusterFork.start(function(master) {
  var numPoints = 1000,
      radius = 1000,
      countCircle = 0,
      total = 0,
      started = new Date();

  var kickOff = function() {
    var numPerWorker = Math.ceil(numPoints/master.numWorkers);
    for (var i = 0; i < master.numWorkers; i++) {
      master.nextWorker.send({ numPerWorker: numPerWorker, radius: radius });
    }
  }

  console.log('-= Forked =-')

  master.on('processed', function(pid, data) {
    total++;
    countCircle += data.count;
    if (total == master.numWorkers) {
      var pi = 4.0 * countCircle / numPoints;
      var duration = (new Date() - started);
      console.log('Approximate value of pi for ' + numPoints + ' points is ' + pi + ' and took ' + duration + 'ms');

      numPoints *= 10;
      radius *= 10;
      countCircle = 0;
      total = 0;
      started = new Date();
      process.nextTick(kickOff);
    }
  });

  kickOff();

  var checkNumPoints = function() {
    if (numPoints < 100000001) {
      process.nextTick(checkNumPoints);
    } else {
      process.exit(0);
    }
  }

  checkNumPoints();
}, function(worker, done) {
  var radius;

  var insideCircle = function(x, y) {
    var squareDist = Math.pow((x-radius), 2) + Math.pow((y-radius), 2);
    return squareDist <= Math.pow(radius, 2);
  }

  worker.on('message', function(data) {
    radius = data.radius;
    var success = 0;
    for (var i = 0; i < data.numPerWorker; i++) {
      var x = Math.floor(Math.random() * (data.radius*2 + 1));
      var y = Math.floor(Math.random() * (data.radius*2 + 1));
      insideCircle(x, y) && success++;
    }
    done({ count: success });
  });
});

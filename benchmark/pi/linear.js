var numPoints = 1000,
    radius = 1000,
    countCircle = 0,
    total = 0;

var started = new Date();

var insideCircle = function(x, y) {
  var squareDist = Math.pow((x-radius), 2) + Math.pow((y-radius), 2);
  return squareDist <= Math.pow(radius, 2);
}

console.log('-= Linear =-')

while (numPoints < 100000001) {
  for (var i = 0; i < numPoints; i++) {
    var x = Math.floor(Math.random() * (radius*2 + 1));
    var y = Math.floor(Math.random() * (radius*2 + 1));
    if (insideCircle(x, y)) {
      countCircle++;
    }
  }

  var pi = 4.0 * countCircle / numPoints;
  var duration = (new Date() - started);
  console.log('Approximate value of pi for ' + numPoints + ' points is ' + pi + ' and took ' + duration + 'ms');
  numPoints *= 10;
  radius *= 10;
  countCircle = 0;
  total = 0;
  started = new Date();
}

process.exit(0);

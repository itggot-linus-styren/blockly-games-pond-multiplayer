
//player1:Super Upgraded Skynet Rabid Mother ducker
var deg, width, amountOfSteps, degLastFoundDuck, Scan_right, currentDeg, moveIteration, shoot_right, scan2, dist, degStep, iteration;

// Describe this function...
function Scan_shoot(deg) {
  Scan_right = scan(deg);
  shoot_right = Infinity > Scan_right;
  if (shoot_right) {
    cannon(deg, Scan_right);
  }
}

// Describe this function...
function Find_duck(deg, width, amountOfSteps) {
  currentDeg = deg;
  scan2 = scan(currentDeg);
  degStep = (width / amountOfSteps) / 2;
  iteration = 1;
  while (scan2 == Infinity && iteration <= amountOfSteps) {
    currentDeg = deg - degStep * iteration;
    scan2 = scan(currentDeg);
    if (scan2 == Infinity) {
      currentDeg = deg + degStep * iteration;
      scan2 = scan(currentDeg);
    }
    iteration += 1;
  }
  if (scan2 == Infinity) {
    currentDeg = Infinity;
  }
  return currentDeg;
}


degLastFoundDuck = Math.random() * 360;
moveIteration = 100;
dist = 0;
while (true) {
  degLastFoundDuck = Find_duck(degLastFoundDuck, 360, 90);
  if (degLastFoundDuck == Infinity) {
    degLastFoundDuck = Math.random() * 360;
  }
  dist = scan(degLastFoundDuck);
  if (dist != Infinity) {
    cannon(degLastFoundDuck, dist);
  }
  if (moveIteration > 25) {
    if (dist > 75) {
      swim(degLastFoundDuck);
    } else {
      swim(Math.random() * 360);
    }
    moveIteration = 0;
  }
  moveIteration += 1;
}

//player2:Aningen Virrig
var swim_direction;


swim_direction = 360 * Math.random();
while (true) {
  swim(swim_direction, 100);
  swim_direction = 360 * Math.random();
}

//player3:rabbit dumb 4
cannon(Math.random(), 70);

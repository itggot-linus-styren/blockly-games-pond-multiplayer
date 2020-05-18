
//player1:Bollhav
var swim_angle, latest_correct_, safe_swim_, canon_scan_angle, latest_hit, enemy_distance;

// Describe this function...
function detect_colision() {
  if (scan(latest_hit) < 10) {
    safe_swim_ = false;
  } else {
    safe_swim_ = true;
  }
}

// Describe this function...
function scan_for_ducks() {
  latest_correct_ = false;
  while (scan(canon_scan_angle) == Infinity) {
    if (latest_correct_) {
      if (scan(latest_hit) != Infinity) {
        canon_scan_angle = latest_hit;
      } else {
        latest_correct_ = false;
      }
    } else {
      canon_scan_angle = canon_scan_angle + 3;
    }
  }
  latest_correct_ = true;
  safe_swim_ = canon_scan_angle;
  enemy_distance = scan(canon_scan_angle);
  swim_angle = canon_scan_angle;
}


swim_angle = 0;
safe_swim_ = true;
canon_scan_angle = 360;
latest_hit = canon_scan_angle;
latest_correct_ = false;
enemy_distance = Infinity;
while (true) {
  scan_for_ducks();
  cannon(canon_scan_angle, enemy_distance);
  detect_colision();
  if (safe_swim_) {
    swim(swim_angle);
  } else {
    stop();
  }
}

//player2:linkaan killer bot
var targetX = 30 + Math.random() * 30;
var targetY = 30 + Math.random() * 30;
var h = health();
var angle = plot_course(targetX, targetY)
var speed = 50
var scanAngle = 0

while (true) {
  var dist = scan(scanAngle, 5)
  scanAngle += 1
  if (scanAngle > 360) scanAngle = 5;
  if (dist < Infinity) {
      cannon(scanAngle, dist);
  }
  
  if (health() != h) {
    targetX = 30 + Math.random() * 30;
    targetY = 30 + Math.random() * 30;
    h = health()
  }
  
  if ((getX() - targetX) < 50 && (getY() - targetY) < 50) {
    swim(0, 0);
  } else {
    swim(angle, speed);
  }
}

function plot_course(xx, yy) {
  var d;
  var x,y;
  var curx, cury;

  curx = getX();  /* get current location */
  cury = getY();
  x = curx - xx;
  y = cury - yy;

  /* atan only returns -90 to +90, so figure out how to use */
  /* the atan() value */

  if (x == 0) {      /* x is zero, we either move due north or south */
    if (yy > cury)
      d = 90;        /* north */
    else
      d = 270;       /* south */
  } else {
    if (yy < cury) {
      if (xx > curx)
        d = 360 + Math.atan_deg(y / x);  /* south-east, quadrant 4 */
      else
        d = 180 + Math.atan_deg(y / x);  /* south-west, quadrant 3 */
    } else {
      if (xx > curx)
        d = Math.atan_deg(y / x);        /* north-east, quadrant 1 */
      else
        d = 180 + Math.atan_deg(y / x);  /* north-west, quadrant 2 */
    }
  }
  return d;
}
//player3:rabbit dumb 3
/* rabbit */
// rabbit runs around the field, randomly and never fires; use as a target.

/* go - go to the point specified */
function go (dest_x, dest_y) {
  var course = plot_course(dest_x, dest_y);
  while (distance(getX(), getY(), dest_x, dest_y) > 5) {
    drive(course, 25);
  }
  while (speed() > 0) {
    drive(course, 0);
  }
}

/* distance forumula. */
function distance(x1, y1, x2, y2) {
  var x = x1 - x2;
  var y = y1 - y2;
  return Math.sqrt((x * x) + (y * y));
}

/* plot_course - figure out which heading to go. */
function plot_course(xx, yy) {
  var d;
  var curx = getX();
  var cury = getY();
  var x = curx - xx;
  var y = cury - yy;

  if (x == 0) {
    if (yy > cury) {
      d = 90;
    } else {
      d = 270;
    }
  } else {
    if (yy < cury) {
      if (xx > curx) {
        d = 360 + Math.atan_deg(y / x);
      } else {
        d = 180 + Math.atan_deg(y / x);
      }
    } else {
      if (xx > curx) {
        d = Math.atan_deg(y / x);
      } else {
        d = 180 + Math.atan_deg(y / x);
      }
    }
  }
  return d;
}

while (true) {
  // Go somewhere in the field.
  var x = Math.random() * 100;
  var y = Math.random() * 100;
  go(x, y);
}

//player1:2
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
//player2:5
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
//player3:8
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
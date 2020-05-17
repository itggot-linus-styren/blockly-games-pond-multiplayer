/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates an pond for avatars to compete in.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Pond');

goog.require('Blockly.Comment');
goog.require('Blockly.Toolbox');
goog.require('Blockly.Trashcan');
goog.require('Blockly.VerticalFlyout');
goog.require('BlocklyGames');
goog.require('Pond.Battle');
goog.require('Pond.Visualization');


/**
 * Optional callback function for when a game ends.
 * @type Function(number)
 */
Pond.endBattle = null;

/**
 * Initialize the pond.  Called on page load.
 */
Pond.init = function () {
  BlocklyInterface.init();
  Pond.Visualization.init();

  BlocklyGames.bindClick('runButton', Pond.runButtonClick);
  BlocklyGames.bindClick('resetButton', Pond.resetButtonClick);
  BlocklyGames.bindClick('docsButton', Pond.docsButtonClick);
  BlocklyGames.bindClick('closeDocs', Pond.docsCloseClick);

  BlocklyGames.bindClick('shiftButton', Pond.shiftButtonClick);
  BlocklyGames.bindClick('uploadButton', Pond.uploadButtonClick);

  // Lazy-load the JavaScript interpreter.
  BlocklyInterface.importInterpreter();
  // Lazy-load the syntax-highlighting.
  BlocklyInterface.importPrettify();
};

/**
 * Is the documentation open?
 * @private
 */
Pond.isDocsVisible_ = false;

Pond.uploadButtonClick = function (e) {
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }

  var playerTag = prompt('Enter your player tag (same as submitted to google forms):');
  console.log("creating request for " + playerTag + " with code: " + BlocklyInterface.getJsCode()); 

  if (playerTag === null) return;

  var payload = {};
  payload[playerTag] = BlocklyInterface.getJsCode();

  var request = new Request('https://5754809c.ngrok.io/tournament',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

  fetch(request)
    .then(function (response) {
      return response.text();
    })
    .then(function (response) {
      alert(response);     
    }).catch(function (error) {
      alert("Oh noes, couldn't upload to tournament: " + error.message);
    });
}

Pond.shiftButtonClick = function (e) {
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }

  for (var i = 0, avatar; (avatar = Pond.Battle.AVATARS[i]); i++) {
    var newStartLoc = Pond.Battle.START_XY[3 - ((Pond.Battle.shiftNum + i) % 4)];
    avatar.setStartLoc(newStartLoc);
    console.log(avatar.name + " : " + Pond.Battle.shiftNum + " : (" + newStartLoc.x + "," + newStartLoc.y + ")");
    avatar.reset();
  }

  Pond.Battle.shiftNum++;

  Pond.Visualization.display_();
}

/**
 * Open the documentation frame.
 */
Pond.docsButtonClick = function () {
  if (Pond.isDocsVisible_) {
    return;
  }
  var origin = document.getElementById('docsButton');
  var dialog = document.getElementById('dialogDocs');
  var frame = document.getElementById('frameDocs');
  var src = 'pond/docs.html?lang=' + BlocklyGames.LANG +
    '&mode=' + BlocklyGames.LEVEL;
  if (frame.src != src) {
    frame.src = src;
  }

  function endResult() {
    dialog.style.visibility = 'visible';
    var border = document.getElementById('dialogBorder');
    border.style.visibility = 'hidden';
  }
  Pond.isDocsVisible_ = true;
  BlocklyDialogs.matchBorder_(origin, false, 0.2);
  BlocklyDialogs.matchBorder_(dialog, true, 0.8);
  // In 175ms show the dialog and hide the animated border.
  setTimeout(endResult, 175);
};

/**
 * Close the documentation frame.
 */
Pond.docsCloseClick = function () {
  if (!Pond.isDocsVisible_) {
    return;
  }
  var origin = document.getElementById('docsButton');
  var dialog = document.getElementById('dialogDocs');

  function endResult() {
    var border = document.getElementById('dialogBorder');
    border.style.visibility = 'hidden';
  }
  Pond.isDocsVisible_ = false;
  BlocklyDialogs.matchBorder_(dialog, false, 0.8);
  BlocklyDialogs.matchBorder_(origin, true, 0.2);
  // In 175ms hide the animated border.
  setTimeout(endResult, 175);
  dialog.style.visibility = 'hidden';
};

/**
 * Click the run button.  Start the Pond.
 * @param {!Event} e Mouse or touch event.
 */
Pond.runButtonClick = function (e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }

  document.getElementById('shiftButton').disabled = true;
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  Pond.execute();
};

/**
 * Click the reset button.  Reset the Pond.
 * @param {!Event} e Mouse or touch event.
 */
Pond.resetButtonClick = function (e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var uploadButton = document.getElementById('uploadButton');
  uploadButton.disabled = true;
  uploadButton.classList.remove('secondary');

  document.getElementById('shiftButton').disabled = false;
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  Pond.reset();
};

/**
 * Execute the users' code.  Heaven help us...
 */
Pond.execute = function () {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(Pond.execute, 250);
    return;
  }
  Pond.reset();

  Pond.Battle.start(Pond.endBattle);
  Pond.Visualization.start();
};

/**
 * Reset the pond and kill any pending tasks.
 */
Pond.reset = function () {
  Pond.Battle.reset();
  Pond.Visualization.reset();
};

/**
 * Show the help pop-up.
 */
Pond.showHelp = function () {
  var help = document.getElementById('help');
  var button = document.getElementById('helpButton');
  var style = {
    width: '50%',
    left: '25%',
    top: '5em'
  };
  BlocklyDialogs.showDialog(help, button, true, true, style,
    BlocklyDialogs.stopDialogKeyDown);
  BlocklyDialogs.startDialogKeyDown();
};

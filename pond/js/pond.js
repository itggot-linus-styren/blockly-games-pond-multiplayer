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
 * Callback function for when a game ends.
 * @param {number} survivors Number of avatars left alive.
 * @suppress {duplicate}
 */
Pond.endBattle = function(survivors) {
  Pond.Visualization.stop();  
  var results = "// Round " + Pond.Battle.round + ": " + Pond.Battle.RANK.filter(function(avatar){return avatar.playable}).map(function(avatar){return avatar.name}).join(", ") + "\n";
  BlocklyInterface.editor['setValue'](results + BlocklyInterface.getJsCode(), -1);
};

/**
 * Initialize the pond.  Called on page load.
 */
Pond.init = function() {
  BlocklyInterface.init();
  Pond.Visualization.init();

  BlocklyGames.bindClick('runButton', Pond.runButtonClick);
  BlocklyGames.bindClick('resetButton', Pond.resetButtonClick);
  BlocklyGames.bindClick('docsButton', Pond.docsButtonClick);
  BlocklyGames.bindClick('closeDocs', Pond.docsCloseClick);

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

/**
 * Open the documentation frame.
 */
Pond.docsButtonClick = function() {
  Pond.Battle.stop();
};

/**
 * Close the documentation frame.
 */
Pond.docsCloseClick = function() {
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
Pond.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';

  document.getElementById('docsButton').disabled = false;
  Pond.execute();
};

/**
 * Click the reset button.  Reset the Pond.
 * @param {!Event} e Mouse or touch event.
 */
Pond.resetButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('docsButton').disabled = true;
  Pond.reset();
};

/**
 * Execute the users' code.  Heaven help us...
 */
Pond.execute = function() {
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
Pond.reset = function() {
  Pond.Battle.reset();
  Pond.Visualization.reset();
};

/**
 * Show the help pop-up.
 */
Pond.showHelp = function() {
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
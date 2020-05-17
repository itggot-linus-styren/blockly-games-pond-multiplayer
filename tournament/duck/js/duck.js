/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates a multi-user pond (duck page).
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Pond.Duck');

goog.require('Blockly.FlyoutButton');
goog.require('Blockly.utils.Coordinate');
goog.require('Blockly.utils.dom');
goog.require('Blockly.ZoomControls');
goog.require('BlocklyAce');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Pond');
goog.require('Pond.Battle');
goog.require('Pond.Blocks');
goog.require('Pond.Duck.soy');
goog.require('Pond.Visualization');


BlocklyGames.NAME = 'pond-duck';

/**
 * Array of editor tabs (Blockly and ACE).
 * @type Array.<!Element>
 */
Pond.Duck.editorTabs = null;

/**
 * ACE editor fires change events even on programmatically caused changes.
 * This property is used to signal times when a programmatic change is made.
 */
Pond.Duck.ignoreEditorChanges_ = true;

/**
 * Initialize Ace and the pond.  Called on page load.
 */
Pond.Duck.init = function() {
  // Render the Soy template.
  document.body.innerHTML = Pond.Duck.soy.start({}, null,
      {lang: BlocklyGames.LANG,
       html: BlocklyGames.IS_HTML});

  Pond.init();

  // Setup the tabs.
  function tabHandler(selectedIndex) {
    return function() {
      if (Blockly.utils.dom.hasClass(tabs[selectedIndex], 'tab-disabled')) {
        return;
      }
      for (var i = 0; i < tabs.length; i++) {
        if (selectedIndex == i) {
          Blockly.utils.dom.addClass(tabs[i], 'tab-selected');
        } else {
          Blockly.utils.dom.removeClass(tabs[i], 'tab-selected');
        }
      }
      Pond.Duck.changeTab(selectedIndex);
    };
  }
  var tabs = Array.prototype.slice.call(
      document.querySelectorAll('#editorBar>.tab'));
  for (var i = 0; i < tabs.length; i++) {
    BlocklyGames.bindClick(tabs[i], tabHandler(i));
  }
  Pond.Duck.editorTabs = tabs;

  var rtl = BlocklyGames.isRtl();
  var visualization = document.getElementById('visualization');
  var tabDiv = document.getElementById('tabarea');
  var blocklyDiv = document.getElementById('blockly');
  var editorDiv = document.getElementById('editor');
  var divs = [blocklyDiv, editorDiv];
  var onresize = function(e) {
    var top = visualization.offsetTop;
    tabDiv.style.top = (top - window.pageYOffset) + 'px';
    tabDiv.style.left = rtl ? '10px' : '420px';
    tabDiv.style.width = (window.innerWidth - 440) + 'px';
    var divTop =
        Math.max(0, top + tabDiv.offsetHeight - window.pageYOffset) + 'px';
    var divLeft = rtl ? '10px' : '420px';
    var divWidth = (window.innerWidth - 440) + 'px';
    for (var i = 0, div; (div = divs[i]); i++) {
      div.style.top = divTop;
      div.style.left = divLeft;
      div.style.width = divWidth;
    }
  };
  window.addEventListener('scroll', function() {
    onresize(null);
    Blockly.svgResize(BlocklyInterface.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  // Inject JS editor.
  var session = BlocklyAce.makeAceSession();
  session['on']('change', Pond.Duck.editorChanged);
  var defaultCode = "//player1\nswim(270, 10);\n//player2\nswim(90, 10);";
  BlocklyInterface.editor['setValue'](defaultCode, -1);

  // Lazy-load the ESx-ES5 transpiler.
  BlocklyAce.importBabel();

  // Inject Blockly.
  BlocklyInterface.injectBlockly(
      {'rtl': false,
       'trashcan': true,
       'zoom': {'controls': true, 'wheel': true}});
  Blockly.JavaScript.addReservedWords('scan,cannon,drive,swim,stop,speed,' +
      'damage,health,loc_x,getX,loc_y,getY,');
  var defaultXml =
      '<xml>' +
        '<block type="pond_cannon" x="70" y="70">' +
          '<value name="DEGREE">' +
            '<shadow type="pond_math_number">' +
              '<mutation angle_field="true"></mutation>' +
              '<field name="NUM">0</field>' +
            '</shadow>' +
          '</value>' +
          '<value name="RANGE">' +
            '<shadow type="pond_math_number">' +
              '<mutation angle_field="false"></mutation>' +
              '<field name="NUM">70</field>' +
            '</shadow>' +
          '</value>' +
        '</block>' +
      '</xml>';
  var xml = Blockly.Xml.textToDom(defaultXml);
  // Clear the workspace to avoid merge.
  BlocklyInterface.workspace.clear();
  Blockly.Xml.domToWorkspace(xml, BlocklyInterface.workspace);
  BlocklyInterface.workspace.clearUndo();

  var players = [
    {
      damage: 0,
      name: 'Player 1',
      code: null,
      num: 1,
    },
    {
      damage: 0,
      name: 'Player 2',
      code: null,
      num: 2,
    },
    {
      damage: 0,
      name: 'Player 3',
      code: null,
      num: 3,
    },
    {
      damage: 0,
      name: 'Player 4',
      code: null,
      num: 4,
    }
  ];

  for (var playerData, i = 0; (playerData = players[i]); i++) {
    var name = playerData.name;
    Pond.Battle.addAvatar(name, playerData.num, BlocklyInterface.getJsCode, null, playerData.damage);
  }

  Blockly.utils.dom.addClass(Pond.Duck.editorTabs[0], 'tab-disabled');
  BlocklyInterface.blocksDisabled = true;
  
  Pond.reset();
  Pond.Duck.changeTab(1); // disable blocks
  Pond.Duck.ignoreEditorChanges_ = false;
};

/**
 * Called by the tab bar when a tab is selected.
 * @param {number} index Which tab is now active (0-1).
 */
Pond.Duck.changeTab = function(index) {
  var BLOCKS = 0;
  var JAVASCRIPT = 1;
  // Show the correct tab contents.
  var names = ['blockly', 'editor'];
  for (var i = 0, name; (name = names[i]); i++) {
    var div = document.getElementById(name);
    div.style.visibility = (i == index) ? 'visible' : 'hidden';
  }
  // Show/hide Blockly divs.
  var names = ['.blocklyTooltipDiv', '.blocklyToolboxDiv'];
  for (var i = 0, name; (name = names[i]); i++) {
    var div = document.querySelector(name);
    div.style.visibility = (index == BLOCKS) ? 'visible' : 'hidden';
  }
  // Synchronize the documentation popup.
  //document.getElementById('docsButton').disabled = false;
  BlocklyGames.LEVEL = (index == BLOCKS) ? 11 : 12;
  if (Pond.isDocsVisible_) {
    var frame = document.getElementById('frameDocs');
    frame.src = 'pond/docs.html?lang=' + BlocklyGames.LANG +
        '&mode=' + BlocklyGames.LEVEL;
  }
  // Synchronize the JS editor.
  if (index == JAVASCRIPT && !BlocklyInterface.blocksDisabled) {
    var code = Blockly.JavaScript.workspaceToCode(BlocklyInterface.workspace);
    Pond.Duck.ignoreEditorChanges_ = true;
    BlocklyInterface.editor['setValue'](code, -1);
    Pond.Duck.ignoreEditorChanges_ = false;
  }
};

/**
 * Change event for JS editor.  Warn the user, then disconnect the link from
 * blocks to JavaScript.
 */
Pond.Duck.editorChanged = function() {
  if (Pond.Duck.ignoreEditorChanges_) {
    return;
  }
  var code = BlocklyInterface.getJsCode();
  if (BlocklyInterface.blocksDisabled) {
    if (!code.trim()) {
      // Reestablish link between blocks and JS.
      BlocklyInterface.workspace.clear();
      Blockly.utils.dom.removeClass(Pond.Duck.editorTabs[0], 'tab-disabled');
      BlocklyInterface.blocksDisabled = false;
    }
  } else {
    if (!BlocklyInterface.workspace.getTopBlocks(false).length ||
        confirm(BlocklyGames.getMsg('Games_breakLink'))) {
      // Break link between blocks and JS.
      Blockly.utils.dom.addClass(Pond.Duck.editorTabs[0], 'tab-disabled');
      BlocklyInterface.blocksDisabled = true;
    } else {
      // Abort change, preserve link.
      Pond.Duck.ignoreEditorChanges_ = true;
      BlocklyInterface.editor['setValue'](code, -1);
      Pond.Duck.ignoreEditorChanges_ = false;
    }
  }
};

window.addEventListener('load', Pond.Duck.init);

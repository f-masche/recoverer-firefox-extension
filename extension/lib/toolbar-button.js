/*
* This module creates a simple toolbar button that opens the extension in a new tab
*/

const { ActionButton } = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const self = require("sdk/self");

const handleToolbarButtonClick = function() {
  tabs.open(self.data.url("./index.html"));
};

const button = ActionButton({
  id: "open-recoverer",
  label: "Open Recoverer",
  icon: {
    "16": "./favicon-active.ico",
    "32": "./favicon-active.ico",
    "64": "./favicon-active.ico"
  },
  onClick: handleToolbarButtonClick
});

exports.button = button;


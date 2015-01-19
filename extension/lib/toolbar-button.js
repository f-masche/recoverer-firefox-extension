const { ActionButton } = require("sdk/ui/button/action");
const mainPanel = require("main-panel");


var toolbarButton = ActionButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./favicon.ico",
    "32": "./favicon.ico",
    "64": "./favicon.ico"
  },
  onClick: handleToolbarButtonClick
});

function activate() {
  toolbarButton.icon = {
    "16": "./favicon-active.ico",
    "32": "./favicon-active.ico",
    "64": "./favicon-active.ico"
  };
  toolbarButton.disabled = false;
} 

function deactivate() {
  toolbarButton.icon = {
    "16": "./favicon.ico",
    "32": "./favicon.ico",
    "64": "./favicon.ico"
  }; 
  toolbarButton.disabled = true;
}

// Show the panel when the user clicks the button.
function handleToolbarButtonClick() {
  mainPanel.show({
    position: toolbarButton
  });
}

exports.activate = activate;

exports.deactivate = deactivate;
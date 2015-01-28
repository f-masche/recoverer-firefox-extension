const { ActionButton } = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const self = require("sdk/self");

ActionButton({
  id: "open-recoverer",
  label: "Open Recoverer",
  icon: {
    "16": "./favicon-active.ico",
    "32": "./favicon-active.ico",
    "64": "./favicon-active.ico"
  },
  onClick: handleToolbarButtonClick
});


function handleToolbarButtonClick() {
  tabs.open(self.data.url("./index.html"));
}
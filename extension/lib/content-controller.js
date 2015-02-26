/*
* This module exports a controller that handles the popup on the login pages.
* It depends on the `content.js` content script file.
*/

const { Class } = require("sdk/core/heritage");
const tasks = require("tasks");

const TAG = "content controller";

const ContentController = Class({

  /**
  * Creates a new ContentController.
  *
  * @param {Worker} worker
  *   Worker attached to the `content.js` content script file.
  *
  * @param {String} taskName
  *   Name of the active task.
  */
  initialize: function(worker, taskName) {
    this.worker = worker;
    this.task = tasks.getTaskForName(taskName);

    if(this.task.loginUrlSelector) {
      console.log(TAG, "Checking for selector " + this.task.loginUrlSelector);

      worker.port.emit("elementExists", this.task.loginUrlSelector);

      worker.port.once("elementExists", function(exists) {
        if(exists) {
          console.log(TAG, "Element exists, showing popup");
          worker.port.emit("showPopup");
        } else {
          console.log(TAG, "Element doesn't exist, aborting");
          worker.detach();
        }
      });
    } else {
      worker.port.emit("showPopup");
    }

    worker.port.once("clickedLoginButton", this.onClickedLoginButton.bind(this));

    worker.port.once("clickedCloseButton", this.onClickedCloseButton.bind(this));
  },

  /**
  * Called when the login button has been clicked.
  */
  onClickedLoginButton: function() {
    if(this.task.name === "auto") {
      this.task.loginUrl = this.worker.tab.url;
    }
    this.worker.tab.url = self.data.url("./index.html");
    this.worker.tab.task = this.task;
    this.worker.detach(); 
  },

  /**
  * Called when the close button has been clicked.
  */
  onClickedCloseButton: function() {
    this.worker.detach();
  }
});

exports.ContentController = ContentController;
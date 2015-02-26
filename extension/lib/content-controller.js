const { Class } = require("sdk/core/heritage");
const tasks = require("tasks");

const TAG = "content controller";

const ContentController = Class({
  initialize: function(worker, taskName) {
    this.worker = worker;
    const task = tasks.getTaskForName(taskName);

    if(task.loginUrlSelector) {
      console.log(TAG, "Checking for selector " + task.loginUrlSelector);

      worker.port.emit("elementExists", task.loginUrlSelector);

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

    worker.port.on("clickedLoginButton", function() {
      if(task.name === "auto") {
        task.loginUrl = worker.tab.url;
      }
      worker.tab.url = self.data.url("./index.html");
      worker.tab.task = task;
      worker.detach();
    });

    worker.port.on("clickedCloseButton", function() {
      worker.detach();
    });
  }
});

exports.ContentController = ContentController;
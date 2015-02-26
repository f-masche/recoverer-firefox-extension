/*
* This module exports the controller for the extensions main page.
* It is attached to the `main.js content script`.
*/

const { Class } = require("sdk/core/heritage");
const { TaskRunner } = require("task-runner");
const { GmailEmailSource } = require("email/gmail-email-source");
const { UserCaptchaSolver } = require("util/user-captcha-solver");
const tasks = require("tasks");

const TAG = "main controller: ";


const MainController = Class({

  /**
  * Creates a new MainController.
  * 
  * @param {Worker} worker
  *   A worker attached to the `main.js` content script.
  */
  initialize: function(worker) {
    this.worker = worker;

    this.worker.port.emit("setTasks", tasks.getTasks());

    this.worker.port.on("runTask", this.onRunTask.bind(this));

    if(this.worker.tab.task) {
      this.worker.port.emit("setTask", this.worker.tab.task);
    }

    console.log(TAG, "new controller");
  },

  /**
  * Handler for the runTask message.
  * Starts a task.
  * 
  * @param {String} taskName
  *   Name of the task to run.
  *
  * @param {String} email
  *   Email of the user.
  */
  onRunTask: function(taskName, userEmail) {
    const self = this;

    const task = tasks.getTaskForName(taskName);

    this.taskRunner = TaskRunner({
      task: task, 
      userEmail: userEmail,
      loginTab: this.worker.tab,
      emailSource: GmailEmailSource(userEmail),
      captchaSolver: UserCaptchaSolver(this.worker)
    });

    const statusUpdateHandler = function(status, statusMessage) {
      self.worker.tab.activate();

      self.worker.port.emit("setStatus", status, statusMessage);
    
      if(status === "error" || status === "loggedIn") {
        self.taskRunner.off("statusUpdate", statusUpdateHandler);
      }
    };

    this.taskRunner.on("statusUpdate", statusUpdateHandler);

    this.taskRunner.run();

    this.worker.port.emit("setView", "pending");
    this.worker.port.emit("setPendingMessage", "Requesting password reset");
  }
});



exports.MainController = MainController;
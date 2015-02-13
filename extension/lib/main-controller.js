const { Class } = require("sdk/core/heritage");
const { TaskRunner } = require("task-runner");
const { GmailEmailSource } = require("email/gmail-email-source");
const { UserCaptchaSolver } = require("util/user-captcha-solver");
const tasks = require("tasks");

const TAG = "main controller:";



const MainController = Class({

  initialize: function(worker) {
    const self = this;

    this.worker = worker;

    this.worker.port.emit("setTasks", tasks.getTasks());

    this.worker.port.on("runTask", function(taskName, email) {
      const task = tasks.getTaskForName(taskName);
      self.runTask(task, email);
    });

    if(this.worker.tab.task) {
      this.worker.port.emit("setTask", this.worker.tab.task);
    }

    worker.on("detach", function () {
      console.log(TAG, "detach");
      self.taskRunner = null;
    });

    console.log(TAG, "new controller");
  },

  runTask: function(task, userEmail) {
    const self = this;

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

    self.taskRunner.on("statusUpdate", statusUpdateHandler);

    this.taskRunner.run();

    this.worker.port.emit("setView", "pending");
    this.worker.port.emit("setPendingMessage", "Requesting password reset");
  }
});



exports.MainController = MainController;
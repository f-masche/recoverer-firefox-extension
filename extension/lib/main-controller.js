const { Class } = require("sdk/core/heritage");
const { TaskRunner } = require("task-runner");
const { GmailEmailSource } = require("email/gmail-email-source");
const tasks = require("tasks");

const TAG = "main controller:";

const UserCaptchaSolver = Class({
  initialize: function(worker) {
    this._worker = worker;
  },
  solveCaptcha: function(imageSrc) {
    const self = this;

    this._worker.tab.activate();

    this._worker.port.emit("solveCaptcha", imageSrc);
    
    return new Promise(function(resolve, reject) {
      self._worker.port.once("solvedCaptcha", function(solution, error) {
        if(error) {
          reject(error);
        } else {
          resolve(solution);
        }
      });
    });
  }
});


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
      // cleanup
    });

    console.log(TAG, "new controller");
  },

  runTask: function(task, email) {
    const self = this;

    this.taskRunner = TaskRunner({
      task: task, 
      email: email,
      loginTab: this.worker.tab,
      emailSource: GmailEmailSource(email),
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

    this.taskRunner.run(email, this.worker.tab);

    this.worker.port.emit("setView", "pending");
    this.worker.port.emit("setPendingMessage", "Requesting password reset");
  }
});



exports.MainController = MainController;
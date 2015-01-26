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

    this.worker.port.emit("setSupportedSites", tasks.getTasks().map((t) => t.name));

    this.worker.port.on("submitedLoginForm", this.onSubmitLoginForm.bind(this));


    this.worker.port.on("clickedOnTask", function(taskName) {
      const task = tasks.getTaskForName(taskName);
      self.setTask(task);
    });

    worker.on("detach", function () {
      if(self.taskRunner) {
        self.taskRunner.cancel();
      }
      console.log(TAG, "detach");
    });

    //get task from url param
    const taskName = worker.tab.url.match(/\?task=([a-zA-Z0-9]+)/);

    if(taskName && taskName.length) {
      const task = tasks.getTaskForName(taskName[1]);
      this.setTask(task);
    }

    console.log(TAG, "new controller");
  },

  setTask : function(task) {
    console.log("Set task to " + task.name);
    this.task = task;
    this.worker.port.emit("setTask", task.name);
    this.worker.port.emit("showView", "login");
  },

  onSubmitLoginForm: function(email) {
    const self = this;

    this.taskRunner = TaskRunner({
      task: this.task, 
      email: email,
      loginTab: this.worker.tab,
      emailSource: GmailEmailSource(email),
      captchaSolver: UserCaptchaSolver(this.worker)
    });

    const statusUpdateHandler = function(status, message) {
      console.log(TAG, status, message);  

      switch(status) {
        case "waitingForMessage":
          self.worker.port.emit("setPendingMessage", "Waiting for email");
          break;
        case "settingNewPassword":
          self.worker.port.emit("setPendingMessage", "Setting new password");
          break;
        case "updatingEmailStatus":
          self.worker.port.emit("setPendingMessage", "Marking message as read");
          break;
        case "loggedIn":
          self.taskRunner.off("statusUpdate", statusUpdateHandler);
          break;
        case "canceled":
          self.worker.port.emit("showView", "login");
          self.taskRunner.off("statusUpdate", statusUpdateHandler);  
          break;
        case "error":
          console.error(TAG, message.message);
          self.worker.port.emit("showErrorMessage", message);
          self.worker.port.emit("showView", "login");
          self.taskRunner.off("statusUpdate", statusUpdateHandler);
          break;
        default:
          break;
        }
    };

    self.taskRunner.on("statusUpdate", statusUpdateHandler);

    this.taskRunner.run(email, this.worker.tab);

    this.worker.port.emit("showView", "pending");
    this.worker.port.emit("setPendingMessage", "Requesting password reset");
  }
});



exports.MainController = MainController;
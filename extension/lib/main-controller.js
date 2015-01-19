const { Class } = require("sdk/core/heritage");
const { TaskRunner } = require("task-runner");
const { GmailMessageSource } = require("gmail-message-source");
const tasks = require("tasks");


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

    this.setTask(worker.tab.task);

    this.worker.port.emit("setSupportedSites", tasks.getTasks().map((task) => task.name));

    this.worker.port.on("submitedLoginForm", this.onSubmitLoginForm.bind(this));

    this.worker.port.on("cancelButtonClicked", this.onCancelButtonClicked.bind(this));

    this.worker.port.on("clickedOnTask", function(taskName) {
      const task = tasks.getTaskForName(taskName);
      self.setTask(task);
    });
  },

  setTask : function(task) {
    if(!task) {
      return;
    }
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
      messageSource: GmailMessageSource(email),
      captchaSolver: UserCaptchaSolver(this.worker)
    });

    const statusUpdateHandler = function(status, message) {
      console.log(status, message);  
      if(status === "waitingForMessage") {
        self.worker.port.emit("setPendingMessage", "Waiting for email");
      } else if(status === "settingNewPassword")  {
        self.worker.port.emit("setPendingMessage", "Setting new password");
      } else if(status === "updatingEmailStatus") {
        self.worker.port.emit("setPendingMessage", "Marking message as read");
      } else if(status === "loggedIn" || status === "canceled") {
        self.taskRunner.off("statusUpdate", statusUpdateHandler);
      } else if(status === "error") {
        console.error(message.message);
        self.worker.port.emit("showErrorMessage", message);
        self.worker.port.emit("showView", "login");
        self.taskRunner.off("statusUpdate", statusUpdateHandler);
      }
    };

    self.taskRunner.on("statusUpdate", statusUpdateHandler);

    this.taskRunner.run(email, this.worker.tab);

    this.worker.port.emit("showView", "pending");
    this.worker.port.emit("setPendingMessage", "Requesting password reset");
  },

  onCancelButtonClicked: function() {
    if(this.taskRunner) {
      this.taskRunner.cancel();
    }
  }
});



exports.MainController = MainController;
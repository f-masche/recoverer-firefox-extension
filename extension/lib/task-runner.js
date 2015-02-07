const { Class, mix } = require("sdk/core/heritage");
const { EventTarget } = require("sdk/event/target");
const { contract } = require("sdk/util/contract");
const { emit } = require("sdk/event/core");

const passwordGenerator = require("util/password-generator");
const { Scraper } = require("util/scraper");


const EVENTS = {
  resettingPassword: "resettingPassword",
  error: "error",
  loggedIn: "loggedIn",
  updatingEmail: "updatingEmail",
  waitingForEmail: "waitingForEmail"
};

const taskRunnerContract = contract({
  task: {
    is: ["object"]
  },
  loginTab: {
    is: ["object"]
  },
  userEmail: {
    is: ["string"]
  },
  emailSource: {
    is: ["object"]
  },
  captchaSolver: {
    is: ["object"]
  }
});

const TaskRunner = Class({

  extends: EventTarget,

  initialize: function(options) {
    taskRunnerContract(options);

    this.task = options.task;

    this.userEmail = options.userEmail;

    this.loginTab = options.loginTab;

    this.emailSource = options.emailSource;

    this.captchaSolver = options.captchaSolver;
  },

  run: function() {

    const self = this;

    this._scraper = Scraper({
      url: this.task.loginUrl, 
      captchaSolver: this.captchaSolver
    });

    this._resetPassword()
      .then(function() {
        return self._getEmail();
      })
      .then(function(email) {
        return self._setNewPassword(email);
      })
      .then(function() {
        return self._setEmailAsRead();
      })
      .then(function() {
        return self._login();
      })
      .catch(function(error) {
        self._setStatus(EVENTS.error, error);
      });
  },

  _setStatus: function(status, message) {
    this.status = status;
    emit(this, "statusUpdate", status, message);
  },

  _resetPassword: function() {
    this._setStatus(EVENTS.resettingPassword);

    this._scraper.goTo(this.task.loginUrl);

    this.task.resetPassword(this._scraper, this.userEmail);

    return this._scraper.run();
  },

  _setNewPassword: function(email) {

    this._setStatus("settingNewPassword");

    this.email = email;
    this.password = passwordGenerator.generatePassword();
    console.log(this.password);
    const url = this._getResetLinkFromEmail();

    if(url) {    
      this._scraper.goTo(url);

      this.task.setNewPassword(this._scraper, this.password);

      return this._scraper.run();
    } else {
      return Promise.reject("No reset link found in email");
    }
  },

  _login: function() {

    const self = this;
    
    this._scraper.goTo(this.task.loginUrl);

    this.task.login(this._scraper, this.userEmail, this.password);

    this.password = null;

    return this._scraper.run().then(function() {
      self.loginTab.url = self._scraper.url;
      self._setStatus(EVENTS.loggedIn);
      self._scraper.destroy();
      return Promise.resolve();
    });
  },

  _setEmailAsRead: function() {
    //if password link was used the email should be marked as read
    this._setStatus(EVENTS.updatingEmail);

    return this.emailSource.setEmailAsRead(this.email.original.id);
  },

  _getEmail: function() {
    this._setStatus(EVENTS.waitingForEmail);
    const filters = mix({in: "inbox", is: "unread"}, this.task.emailFilters);

    return this.emailSource.waitForEmail(filters);
  },

  _getResetLinkFromEmail: function() {
    const matches = this.email.text.match(this.task.resetLinkPattern);

    if(matches) {
      return matches[0];
    } else {
      return null;
    }
  }
});

exports.TaskRunner = TaskRunner;

exports.EVENTS = EVENTS;


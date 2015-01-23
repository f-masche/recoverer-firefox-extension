const { Class, extend } = require("sdk/core/heritage");
const { EventTarget } = require("sdk/event/target");
const { contract } = require("sdk/util/contract");
const { emit } = require("sdk/event/core");

const passwordGenerator = require("password-generator");
const { Scraper } = require("scraper");


const taskRunnerContract = contract({
  task: {
    is: ["object"]
  },
  loginTab: {
    is: ["object"]
  },
  email: {
    is: ["string"]
  },
  messageSource: {
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

    this.email = options.email;

    this.loginTab = options.loginTab;

    this.messageSource = options.messageSource;

    this.captchaSolver = options.captchaSolver;
  },

  run: function() {

    const self = this;

    this._resetPassword()
      .then(function() {
        return self._getMessage();
      })
      .then(function(message) {
        return self._setNewPassword(message);
      })
      .then(function() {
        return self._setMessageAsRead();
      })
      .then(function() {
        return self._login();
      })
      .catch(function(error) {
        self._setStatus("error", error);
      });
  },

  _setStatus: function(status, message) {
    this.status = status;
    emit(this, "statusUpdate", status, message);
  },

  _resetPassword: function() {

    const scraper = Scraper(this.task.loginUrl, this.captchaSolver);

    this._setStatus("resettingPassword");
    this.task.resetPassword(scraper, this.email);

    return scraper.run();
  },

  _setNewPassword: function(message) {

    this._setStatus("settingNewPassword");

    this.message = message;
    this.password = passwordGenerator.generatePassword();

    const url = this._getResetLinkFromMessage();

    if(url) {
      const scraper = Scraper(url, this.captchaSolver);
      this.task.setNewPassword(scraper, this.password);

      return scraper.run();
    } else {
      return Promise.reject("No reset link found in message");
    }
  },

  _login: function() {

    const scraper = Scraper(this.task.loginUrl, this.captchaSolver);
    const self = this;
    
    this.task.login(scraper, this.email, this.password);

    return scraper.run().then(function() {
      self.loginTab.url = scraper.url;
      self._setStatus("loggedIn");
      return Promise.resolve();
    });
  },

  _setMessageAsRead: function() {
    //no canceling possible here
    //if password link was used the email should be marked as read
    this._setStatus("updatingMessageStatus");

    return this.messageSource.setMessageAsRead(this.email, this.message);
  },

  _getMessage: function() {
    this._setStatus("waitingForMessage");
    const filters = extend(this.task.messageFilters, {in: "inbox", is: "unread"});
    return this.messageSource.waitForMessage(filters);
  },

  _getResetLinkFromMessage: function() {
    const matches = this.message.text.match(this.task.resetLinkPattern);

    if(matches) {
      return matches[0];
    } else {
      return null;
    }
  }
});

exports.TaskRunner = TaskRunner;



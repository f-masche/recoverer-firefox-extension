const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");

const taskContract = contract({
  loginUrl: {
    is: ["string"]
  },
  loginUrlPattern: {
    is: ["regexp"]
  },
  resetLinkPattern: {
    is: ["regexp"]
  },
  loginUrlSelector: {
    map: (v) => v || null,
    is: ["string", "null"]
  },
  emailFilters: {
    is: ["object"]
  },
  name: {
    is: ["string"]
  },
  resetPassword: {
    is: ["function"]
  },
  setNewPassword: {
    is: ["function"]
  },
  login: {
    is: ["function"]
  }
});

/**
* This is an abstract class for a task.
*/
const Task = Class({
  initialize: function() {
    //validate implementation
    taskContract(this);
    console.log("Tasks: new task: " + this.name);
  },

  toJSON: function() {
    return {
      loginUrl: this.loginUrl,
      loginUrlPattern: this.loginUrlPattern,
      loginUrlSelector: this.loginUrlSelector,
      resetLinkPattern: this.resetLinkPattern,
      emailFilters: this.emailFilters,
      name: this.name
    };
  },
  
/* jshint ignore:start */

  resetPassword: function(scraper, email) {
    throw new Error("This method must be implemented");
  },
  setNewPassword: function(scraper, password) { 
    throw new Error("This method must be implemented");
  },
  login: function(scraper, email, password) {
    throw new Error("This method must be implemented");
  }

/* jshint ignore:end */

});


exports.Task = Task;



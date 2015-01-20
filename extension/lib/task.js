const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");
const { merge } = require("sdk/util/object");

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
  messageFilters: {
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
  initialize: function(options) {
    //validate options
    taskContract(options);

    merge(this, options);
    console.log(JSON.stringify(this));
    console.log("tasks: new task: " + this.name);
  },


/* jshint ignore:start */

  resetPassword: function(scraper, email) {
    throw new Error("this method must be implemented");
  },
  setNewPassword: function(scraper, password) { 
    throw new Error("this method must be implemented");
  },
  login: function(scraper, email, password) {
    throw new Error("this method must be implemented");
  }

/* jshint ignore:end */

});


exports.Task = Task;


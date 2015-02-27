const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");

/**
* Contract to validate the Task interface.
*/
const taskContract = contract({

  /**
  * The URL with the login form.
  * The task will start here.
  */
  loginUrl: {
    is: ["string"]
  },

  /**
  * Pattern to recognize the login URL
  */
  loginUrlPattern: {
    is: ["regexp"]
  },

  /**
  * Pattern of the link in the email.
  */
  resetLinkPattern: {
    is: ["regexp"]
  },


  /**
  * Selector that will be used to verify the login page.
  * @optional
  */
  loginUrlSelector: {
    map: (v) => v || null,
    is: ["string", "null"]
  },

  /**
  * Filters to find the email.
  * e.g. {from: "sample@sample.com", subject: "password"}
  */
  emailFilters: {
    is: ["object"]
  },

  /**
  * The name of the task
  */
  name: {
    is: ["string"]
  },

  /**
  * A function that requests a new password.
  * Gets called with a Scraper and an email.
  * 
  * @param {Scraper} scraper
  *   A scaper
  *
  * @param {String} email
  *   The users email address
  */
  resetPassword: {
    is: ["function"]
  },
  
  /**
  * A function that sets a new password.
  * 
  * @param {Scraper} scraper
  *   A scaper
  *
  * @param {String} password
  *   A new password
  */
  setNewPassword: {
    is: ["function"]
  },

  /**
  * A function that performs the login.
  * Gets called with a Scraper and an email.
  * 
  * @param {Scraper} scraper
  *   A scaper
  *
  * @param {String} email
  *   The users email address
  *
  * @param {String} password
  *   The users password
  */
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
  }
});


exports.Task = Task;



const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The Fail operation will terminate the scraper
*/
const Fail = Class({

  extends: Operation,

  /**
  * Creates a new Fail operation.
  *
  * @param {String} message 
  *   The error message
  */
  initialize: function(message) {
    Operation.prototype.initialize.call(this, "error");
    this.message = message;
  },

  handler: function(runtime, success, failure) {
    failure(this.message);
  }
});

exports.Fail = Fail;
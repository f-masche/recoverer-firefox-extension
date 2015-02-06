const { Class } = require("sdk/core/heritage");

/**
* Base class for a scraper dsl operation.
* This is an atomic operation for the scraper.
*/
const Operation = Class({

  /**
  * Creates a new Operation.
  *
  * @param {name} name 
  *   The name of this action
  */
  initialize: function(name) {
    this.name = name;
  },

  /**
  * This method must be overwritten.
  *
  * It contains the logic for the specific Operation.
  *
  * @param {function} resolve 
  *   Called when the handler finished successfully
  * @param {function} reject 
  *   Called when the handler finished with an error
  */
  handler: function(runtime, success, failure) { // jshint ignore:line
    success();
  }
});

exports.Operation = Operation;
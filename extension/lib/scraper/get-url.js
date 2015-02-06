const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The GetURL operation pushes the current URL onto the stack.
*/
const GetURL = Class({

  extends: Operation,

  /**
  * Creates a new GetURL operation.
  */
  initialize: function() {
    Operation.prototype.initialize.call(this, "getURL");
  },

  handler: function(runtime, success) {
    runtime.stack.push(runtime.tab.url);
    console.log("Got url " + runtime.tab.url);
    success();
  }
});

exports.GetURL = GetURL;
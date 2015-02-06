const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The ElementExists looks for a certain element.
* If the element exists it will push `true` on the stack, else `false`-
*/
const ElementExists = Class({

  extends: Operation,

  /**
  * Creates a new ElementExists operation.
  */
  initialize: function() {
    Operation.prototype.initialize.call(this, "elementExists");
  },

  handler: function(runtime, success) {
    const selector = runtime.stack.pop();

    console.log("Looking for " + selector);

    runtime.worker.port.emit("getElement", selector);

    runtime.worker.port.once("gotElement", function(error) {

      if (error) {
        console.log("Couldn't find " + selector);
        runtime.stack.push(false);
      } else {
        runtime.stack.push(true);
        console.log("Found " + selector);
      }
      success();
    });
  }
});

exports.ElementExists = ElementExists;
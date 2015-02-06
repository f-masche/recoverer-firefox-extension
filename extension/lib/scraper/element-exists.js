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
  *
  * @param {String} selector 
  *   The selector for the expected element
  */
  initialize: function(selector) {
    Operation.prototype.initialize.call(this, "elementExists");
    this.selector = selector;
  },

  handler: function(runtime, success) {
    const self = this;

    console.log("Looking for " + this.selector);

    runtime.worker.port.emit("getElement", this.selector);

    runtime.worker.port.once("gotElement", function(error) {

      if (error) {
        console.log("Couldn't find " + self.selector);
        runtime.stack.push(false);
      } else {
        runtime.stack.push(true);
        console.log("Found " + self.selector);
      }
      success();
    });
  }
});

exports.ElementExists = ElementExists;
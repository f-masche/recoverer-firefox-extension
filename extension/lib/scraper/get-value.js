const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The GetValue operation gets the value of an element.
* It will fail if the element doesn't exist.
*/
const GetValue = Class({

  extends: Operation,

  /**
  * Creates a new GetValue operation.
  *
  * @param {String} selector 
  *   The selector for the element with the text
  */
  initialize: function(selector) {
    Operation.prototype.initialize.call(this, "getText");
    this.selector = selector;
  },

  handler: function(runtime, success, failure) {
    const self = this;

    console.log("Looking for value in " + this.selector);

    runtime.worker.port.emit("getValue", this.selector);

    runtime.worker.port.once("gotValue", function(value, error) {
      if (error) {
        console.log(error);
        failure("Could not get value in " + self.selector);
      } else {
        console.log("Got value: " + value);

        runtime.stack.push(value);

        success();
      }
    });
  }
});

exports.GetText = GetValue;
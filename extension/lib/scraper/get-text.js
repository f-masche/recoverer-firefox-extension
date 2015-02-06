const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The GetText operation gets the text content of an element.
* It will fail if the element doesn't exist.
*/
const GetText = Class({

  extends: Operation,

  /**
  * Creates a new GetText operation.
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

    console.log("Looking for text in " + this.selector);

    runtime.worker.port.emit("getText", this.selector);

    runtime.worker.port.once("gotText", function(text, error) {
      if (error) {
        console.log(error);
        failure("Could not get text in " + self.selector);
      } else {
        console.log("Got text: " + text);
        runtime.stack.push(text);
        success();
      }
    });
  }
});

exports.GetText = GetText;
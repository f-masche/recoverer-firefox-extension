const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The SetValue operation will fill a text into an input field.
* Fails if the input field doesn't exist. 
*/
const SetValue = Class({

  extends: Operation,

  /**
  * Creates a new SetValue operation.
  *
  * @param {String} selector 
  *   The selector for the input field 
  * @param {String} text 
  *   The text to fill in
  */
  initialize: function(selector, value) {
    Operation.prototype.initialize.call(this, "setValue");
    this.selector = selector;
    this.value = value;
  },

  handler: function(runtime, success, failure) {
    const self = this;

    console.log("Filling in value " + this.value + " in to " + this.selector);

    runtime.worker.port.emit("setValue", this.selector, this.value);

    runtime.worker.port.once("setValue", function(error) {
      if(error) {
        console.log(error);
        failure("Could not fill in " + self.value + " into " + self.selector);
      } else {
        console.log("Filled in value " + self.value + " in to " + self.selector);
        success();
      }
    });
  }
});

exports.SetValue = SetValue;
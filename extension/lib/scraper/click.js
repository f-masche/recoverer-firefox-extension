const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The Click operation simulates a user click on an element.
* Fails if the element doesn't exist. 
*/
const Click = Class({

  extends: Operation,

  /**
  * Creates a new Click operation.
  *
  * @param {String} selector 
  *   The selector for the element to click on
  */
  initialize: function(selector) {
    Operation.prototype.initialize.call(this, "click");
    this.selector = selector;
  },

  handler: function(runtime, success, failure) {
    const self = this;

    console.log("Clicking on " + this.selector);

    runtime.worker.port.emit("clickOn", this.selector);

    runtime.worker.port.once("clickedOn", function(error) {
      if(error) {
        console.log("Could not click on " + self.selector);
        failure("Could not click on " + self.selector);
      } else {
        console.log("Clicked on " + self.selector);
        success();
      }
    });
  }
});

exports.Click = Click;
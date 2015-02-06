const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The GetAttribute operation gets an attribute value of an element.
* It will fail if the element doesn't exist.
*/
const GetAttribute = Class({

  extends: Operation,

  /**
  * Creates a new GetAttribute operation.
  *
  * @param {String} selector 
  *   The selector for the element with the attribute
  * @param {String} selector 
  *   The name of the attribute
  */
  initialize: function(selector, attrName) {
    Operation.prototype.initialize.call(this, "getText");
    this.selector = selector;
    this.attrName = attrName;
  },

  handler: function(runtime, success, failure) {
    const self = this;

    console.log("Looking for attribute " + this.attrName + " in " + this.selector);

    runtime.worker.port.emit("getAttribute", this.selector, this.attrName);

    runtime.worker.port.once("gotValue", function(attribute, error) {
      if (error) {
        console.log(error);
        failure("Could not get attribute " + this.attrName + " in " + self.selector);
      } else {
        console.log("Got attribute: " + attribute);
        runtime.stack.push(attribute);

        success();
      }
    });
  }
});

exports.GetText = GetAttribute;
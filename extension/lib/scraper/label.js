const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* This operation adds a label.
*/
const Label = Class({

  extends: Operation,

  /**
  * Creates a new Label operation.
  *
  * @param {integer} label 
  *   The label to add
  */
  initialize: function(label) {
    Operation.prototype.initialize.call(this, "label");
    this.label = label;
  }
});

exports.Label = Label;
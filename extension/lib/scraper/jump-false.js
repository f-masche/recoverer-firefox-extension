const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The JumpFalse operation jumps to a label if the value on top of the stack is `false`.
*/
const JumpFalse = Class({

  extends: Operation,

  /**
  * Creates a new JumpIf operation.
  *
  * @param {String} label 
  *   The label for the jump
  */
  initialize: function(label) {
    Operation.prototype.initialize.call(this, "jumpFalse");
    this.label = label;
  },

  handler: function(runtime, success) {
    if(runtime.stack.pop() === false) {
      runtime.goToLabel(this.label);
    }
    success();
  }
});

exports.JumpFalse = JumpFalse;
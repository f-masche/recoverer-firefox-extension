const { Class } = require("sdk/core/heritage");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Jump } = require("scraper/jump");
const { ElementExists } = require("scraper/element-exists");
const { LoadURL } = require("scraper/load-url");
const { Label } = require("scraper/label");
const { WaitForLoad } = require("scraper/wait-for-load");
const { Click } = require("scraper/click");
const { GetText } = require("scraper/get-text");
const { GetValue } = require("scraper/get-value");
const { GetAttribute } = require("scraper/get-attribute");
const { GetURL } = require("scraper/get-url");
const { SetValue } = require("scraper/get-value");
const { SolveCapcha } = require("scraper/solve-capcha");

const TAG = "scraper: ";


const LabelStack = Class({
  initialize: function() {
    this.stack = [];
  },
  pushLabel: function() {
    const label = this.stack.length;
    this.stack.push(label);
    return label;
  },
  popLabel: function() {
    this.stack.pop();
  },
  getLabel: function(n) {
    return this.stack[this.stack.length + n];
  }
});


const Runtime = Class({
  stack: [],
  pointer: 0,
  labels: [],
  initialize: function(capchaSolver) {
    this.capchaSolver = capchaSolver;
  },
  init: function() {
    const self = this;

    const handleTabOpen = function(tab, resolve) {

      self.tab = tab;

      tab.on("load", function(tab) {
        console.log(TAG, "on " + tab.url);
        self.url = tab.url;
        self.worker = tab.attach({
          contentScriptFile: ["./scraper.js"]
        });
      });

      tab.once("load", function() {
        //bugfix @see WaitForLoadingOperation#handler
        setTimeout(resolve, 1);
      });
    };

    return new Promise(function(resolve) {
      tabs.open({
        url: "about:blank",
        onOpen: function(tab) {
          handleTabOpen(tab, resolve);
        }
      });
    });
  },

  run: function(operations) {
    const self = this;

    this.operations = operations;
    this.stack = [];
    this.pointer = 0;
    this.labels = [];

    const next = function(success, failure) {
      const op = self.operations[self.pointer];
      console.log(self.pointer);
      self.pointer++;

      if(op) {
        op.handler(self, function() {
          next(success, failure);
        }, failure);       
      } else {
        success();
      }
    };

    return new Promise(next);
  },
  goToLabel: function(labelId) {
    var label = null;

    for(let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i];
      if(operation.name === "label" && operation.label === labelId) {
        label = i;
        break;
      }
    }

    if(label === null) {
      throw new Error("No label exists with id " + labelId);
    }

    console.log("Juming to " + label);

    this.pointer = label;
  }
});



const Element = Class({
  initialize: function(operations, labelStack, selector) {
    this.operations = operations;
    this.labelStack = labelStack;
    this.selector = selector;
  },
  text: function(callback) {
    this.operations.push(GetText(this.selector, callback));
  },
  value: function(callback) {
    this.operations.push(GetValue(this.selector, callback));
  },
  attribute: function(attrName, callback) {
    this.operations.push(GetAttribute(this.selector, attrName, callback));
  },
  click: function() {
    this.operations.push(Click(this.selector));
  },
  fillIn: function(value) {
    this.operations.push(SetValue(value));
  }
});

const URLCondition = Class({
  initialize: function(operations, labelStack) {
    this.operations = operations;
    this.labelStack = labelStack;
    this.negated = false;
  },
  is: function(value, callback) {

    this.labelStack.pushLabel();
    this.operations.push(GetURL());

    this.operations.push(Jump(value, this.labelStack.getLabel(-1), this.negated));

    callback.call(Command(this.operations, this.labelStack));

    this.operations.push(Label(this.labelStack.getLabel(-1)));
  },
  not: function() {
    this.negated = true;
    return this;
  }
});

const ElementCondition = Class({
  initialize: function(operations, labelStack, selector) {
    this.operations = operations;
    this.labelStack = labelStack;
    this.negated = false;
    this.selector = selector;
  },
  exists: function(callback) {

    this.labelStack.pushLabel();
    this.operations.push(ElementExists(this.selector));

    this.operations.push(Jump(true, this.labelStack.getLabel(-1), this.negated));

    callback.call(Command(this.operations, this.labelStack));

    this.operations.push(Label(this.labelStack.getLabel(-1)));
  },
  not: function() {
    this.negated = true;
    return this;
  }
});


const Command = Class({
  initialize: function(operations, labelStack) {
    this.operations = operations;
    this.labelStack = labelStack;
  },
  goTo: function(url) {
    this.operations.push(LoadURL(url));
    this.operations.push(WaitForLoad());
  },
  getElement: function(selector) {
    return Element(this.operations, this.labelStack, selector);
  },
  ifElement: function(selector) {
    return ElementCondition(this.operations, this.labelStack, selector);
  },
  ifURL: function() {
    return URLCondition(this.operations, this.labelStack);
  },
  waitForLoading: function() {
    this.operations.push(WaitForLoad());
  },
  solveCaptcha: function(captchaImgSelector, captchaInputSelector) {
    this.operations.push(SolveCapcha(captchaImgSelector, captchaInputSelector));
  }
});




const Scraper = Class({

  initialize: function(capchaSolver) {
    this.runtime = Runtime(capchaSolver);
  },
  run: function(callback) {
    const self = this;
    const operations = [];
    const labelStack = LabelStack();
    const command = Command(operations, labelStack);
    callback.call(command, command);

    return this.runtime.init().then(function() {
      return self.runtime.run(operations);  
    });
  }
});

exports.Scraper = Scraper;
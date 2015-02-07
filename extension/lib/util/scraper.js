const { setTimeout, clearTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");
const tabs = require("sdk/tabs");
const { attach } = require("sdk/content/mod");
const { Style } = require("sdk/stylesheet/style");

const TAG = "scraper:";


/**
* Base class for a scraper Operation.
* An Operation is an atomic operation for the scraper.
* Each Operation has an asynchronous handler method.
* This is needed to queue and chain multiple Operations.
*/
const Operation = Class({
  /**
  * This method must be overwritten.
  *
  * It contains the logic for the specific Operation.
  * It will be called in the `run` method.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {function} success 
  *   Called when the handler finished successfully
  * @param {function} failure 
  *   Called when the handler finished with an error
  */
  handler: function(scraper, success, failure) { // jshint ignore:line
    success();
  }
});


/**
* The Init operation is the first default Operation in the scraper.
* It creates a new Tab and loads the content script. 
*/
const Init = Class({

  extends: Operation,

  initialize: function() {
    this.name = "init";
  },

  handler: function(scraper, success) {
    const self = this;

    tabs.open({
      url: "about:blank",
      onOpen: function(tab) {
        self.initTab(tab, scraper, success);
      }
    });
  },

  initTab: function(tab, scraper, resolve) {
    scraper._tab = tab;

    tab.on("load", function(tab) {
      console.log(TAG, "on " + tab.url);
      scraper.url = tab.url;
      scraper._worker = tab.attach({
        contentScriptFile: ["./scraper.js"]
      });
    });

    tab.once("load", function() {
      //bugfix @see WaitForLoadingAction#handler
      setTimeout(resolve, 1);
    });
  }
});


/**
* The GoTo operation loads a specific URL in the scraper tab.
*/
const GoTo = Class({

  extends: Operation,

  /**
  * @param {String} url 
  *   The URL to load
  */
  initialize: function(url) {
    this.url = url;
    this.name = "goTo";
  },

  handler: function(scraper, success) {
    console.log(TAG, "Going to " + this.url);
    scraper._tab.url = this.url;
    success();
  }
});


/**
* The WaitForLoading operation waits until the ready event is fired on the scraper tab.
*/
const WaitForLoading = Class({

  extends: Operation,

  maxTime: 5000,

  initialize: function() {
    this.name = "waitForLoading";
  },

  handler: function(scraper, success, failure) {
    console.log(TAG, "Waiting for load");

    const timeoutId = setTimeout(function() {
      scraper._tab.off("load", onReadyHandler);
      console.error(TAG, "Timed out while waiting for page to load");
      failure("Timed out while waiting for page to load");
    }, this.maxTime);

    const onReadyHandler = function(tab) {
      console.log(TAG, "Loaded " + tab.url);

      clearTimeout(timeoutId);
      
      // bugfix
      // If this is the last Operation in the stack, firefox throws a
      // TypeError "can't access dead object"
      // The source of the error is unknown, but the timeout seems to prevent it
      setTimeout(function() {
        success(tab.url);
      }, 1);
    };

    scraper._tab.once("load", onReadyHandler);
  }
});


/**
* The IfExists operation looks for a certain element and calls a callback if it exists.
*/
const IfExists = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the expected element
  */
  initialize: function(selector, callback, negated) {
    this.selector = selector;
    this.callback = callback;
    this.negated = negated;
    this.name = "ifExists";
  },

  handler: function(scraper, success) {
    const self = this;

    console.log(TAG, "Looking for " + this.selector);

    scraper._worker.port.emit("getElement", this.selector, this.attribute);

    scraper._worker.port.once("gotElement", function(error) {

      if(self.negated) {
        error = !error;
      }

      if (!error) {  
        self.callback();
      }

      success();
    });
  }
});


/**
* The GetText operation gets the text content of an element.
* It will fail if the element doesn't exist.
*/
const GetText = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the element with the text
  */
  initialize: function(selector) {
    this.selector = selector;
    this.name = "getText";
  },

  handler: function(scraper, success, failure) {
    const self = this;

    console.log(TAG, "Looking for text in " + this.selector);

    scraper._worker.port.emit("getText", this.selector);

    scraper._worker.port.once("gotText", function(text, error) {
      if (error) {
        console.log(TAG, error);
        failure("Could not get text in " + self.selector);
      } else {
        console.log(TAG, "Got text: " + text);
        scraper.results.push(text);
        success();
      }
    });
  }
});


/**
* The GetValue operation gets the value of an element.
* It will fail if the element doesn't exist.
*/
const GetValue = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the element with the value
  */
  initialize: function(selector) {
    this.selector = selector;
    this.name = "getValue";
  },

  handler: function(scraper, success, failure) {
    const self = this;

    console.log(TAG, "Looking for value in " + this.selector);

    scraper._worker.port.emit("getValue", this.selector);

    scraper._worker.port.once("gotValue", function(value, error) {
      if (error) {
        console.log(TAG, error);
        failure("Could not get value in " + self.selector);
      } else {
        console.log(TAG, "Got value: " + value);
        scraper.results.push(value);
        success();
      }
    });
  }
});


/**
* The FillIn operation will fill a text into an input field.
* Fails if the input field doesn't exist. 
*/
const FillIn = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the input field 
  * @param {String} text 
  *   The text to fill in
  */
  initialize: function(selector, value) {
    this.selector = selector;
    this.value = value;
    this.name = "fillIn";
  },

  handler: function(scraper, success, failure) {
    console.log(TAG, "Filling in value " + this.value + " in to " + this.selector);
    const self = this;
    scraper._worker.port.emit("fillIn", this.selector, this.value);

    scraper._worker.port.once("filledIn", function(error) {
      if(error) {
        console.log(TAG, error);
        failure("Could not fill in " + self.value + " into " + self.selector);
      } else {
        console.log(TAG, "Filled in value " + self.value + " in to " + self.selector);
        success();
      }
    });
  }
});


/**
* The ClickOn operation simulates a user click on an element.
* Fails if the element doesn't exist. 
*/
const ClickOn = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the element to click on
  */
  initialize: function(selector) {
    this.selector = selector;
    this.name = "clickOn";
  },

  handler: function(scraper, success, failure) {
    console.log(TAG, "Clicking on " + this.selector);

    const self = this;

    scraper._worker.port.emit("clickOn", this.selector);

    scraper._worker.port.once("clickedOn", function(error) {
      if(error) {
        console.log(TAG, error);
        failure("Could not click on " + self.selector);
      } else {
        console.log(TAG, "Clicked on " + self.selector);
        success();
      }
    });
  }
});

/**
* The IfURLIs operation calls a callback if the current url matches a given pattern.
*/
const IfURLIs = Class({

  extends: Operation,

  /**
  * @param {String|RegEx} pattern 
  *   The selector for the element to click on
  * @param {Function} callback
  *   The callback that will be called
  * @param {boolean} negated
  *   Negates this operation
  */
  initialize: function(pattern, callback, negated) {
    this.pattern = pattern;
    this.callback = callback;
    this.negated = negated;
    this.name = "ifURLIs";
  },

  handler: function(scraper, success) {

    var matches = false;
    if(this.pattern instanceof RegExp) {
      matches = this.pattern.test(scraper._tab.url);
    } else {
      matches = this.pattern === scraper._tab.url;
    }

    if(this.negated) {
      matches = !matches;
    }

    if(matches && typeof this.callback === "function") {
      this.callback();
    }
    success();
  }
});


/**
* The GetAttribute operation gets the value of a specific attribute.
* Fails if the attribute or the element doesn't exist. 
*/
const GetAttribute = Class({

  extends: Operation,

  /**
  * @param {String} selector 
  *   The selector for the element with the attribute
  * @param {String} attribute
  *   The name of the attribute
  */
  initialize: function(selector, attribute) {
    this.selector = selector;
    this.attribute = attribute;
    this.name = "getAttribute";
  },

  handler: function(scraper, success, failure) {
    console.log(TAG, "Getting attribute " + this.attribute + " on " + this.selector);

    scraper._worker.port.emit("getAttribute", this.selector, this.attribute);

    scraper._worker.port.once("gotAttribute", function(value, error) {

      if (error) {
        console.log(TAG, "Could not find attribute " + value);
        failure("Could not find attribute " + self.attribute + " on " + self.selector);
      } else {
        console.log(TAG, "Found attribute " + value);
        scraper.results.push(value);
        success();
      }
    });
  }
});


/**
* The SolveCaptcha operation enables the scraper to solve a captcha.
* Depending on the used captcha solver this can be done by the user or automatically.
*/
const SolveCaptcha = Class({

  extends: Operation,

  /**
  * @param {String} captchaImgSelector 
  *   The selector for the captcha img element
  * @param {String} captchaInputSelector
  *   The selector for the captcha text input element
  */
  initialize: function(captchaImgSelector, captchaInputSelector) {
    this.captchaImgSelector = captchaImgSelector;
    this.captchaInputSelector = captchaInputSelector;
    this.name = "solveCaptcha";
  },

  handler: function(scraper, success, failure) {
    const self = this;

    scraper._worker.port.emit("getAttribute", this.captchaImgSelector, "src");

    scraper._worker.port.once("gotAttribute", function(value, error) {

      if(error) {
        console.log(TAG, "Could not find captcha image :" + self.captchaImgSelector);
        failure("Could not find captcha image :" + self.captchaImgSelector);
      } else {
        console.log(TAG, "Found captcha image :" + value);

        scraper._captchaSolver.solveCaptcha(value).then(function(solution) {

          scraper._worker.port.emit("fillIn", self.captchaInputSelector, solution);

          scraper._worker.port.once("filledIn", function(error) {
            if(error) {
              console.log(TAG, "Could not find captcha input field: " + self.captchaInputSelector);
              failure("Could not find captcha input field: " + self.captchaInputSelector);
            } else {
              scraper.results.push(solution);
              success();
            }
          });

        }, failure);
      }
    });
  }
});


/**
* The WaitForElement operation waits until a specific element appears on the page.
*/
const WaitForElement = Class({

  extends: Operation,

  /**
  * @param {String} selector
  *   The selector for the element to wait for
  */
  initialize: function(selector) {
    this.selector = selector;
    this.name = "waitForElement";
  },

  handler: function(scraper, success) {
    console.log(TAG, "Waiting for element " + this.selector);

    const time = 2000;

    var timeoutId = -1;

    scraper._worker.port.emit("waitForElement", this.selector, time);

    const handler = function() {
      console.log(TAG, "Waited for element " + this.selector);
      clearTimeout(timeoutId);
      success();
    };

    scraper._worker.port.once("waitedForElement", handler);
  
    //set a second timeout independent to the content script
    //the content script could be unloaded so the event never gets fired
    timeoutId = setTimeout(function() {
      scraper._worker.port.off("waitedForElement", handler);
      console.log(TAG, "Waited for element " + this.selector);
      success();
    }, time * 1.5);
  }
});


/**
* Lete the scraper fail with a given reason.
*/
const Fail = Class({
  extends: Operation,

  /**
  * @param {String} reason
  *   The reason on the failure
  */
  initialize: function(reason) {
    this.reason = reason;
    this.name = "fail";
  },
  handler: function(scraper, success, failure) {
    failure(this.reason);
  }
});



const scraperContract = contract({
  captchaSolver: {
    is: ["object"]
  }
});

/**
* The main scraper class.
*/
const Scraper =  Class({

  initialize: function(options) {

    scraperContract(options);

    this.results = [];

    this._captchaSolver = options.captchaSolver;
    this._stack = [];
    this._stackInsertIndex = 0;

    this._addOperation(Init());

    console.log(TAG, "new scraper on: " + this.url);
  },

  /**
  * @see GoTo
  *
  * @return {Scraper} 
  *   This scraper
  */
  goTo: function(url) {
    this._addOperation(GoTo(url));
    this._addOperation(WaitForLoading());
    return this;
  },


  /**
  * @see IfExists
  *
  * @return {Scraper} 
  *   This scraper
  */
  ifExists: function(selector, callback) {
    this._addOperation(IfExists(selector, callback, false));
    return this;
  },

  /**
  * @see IfExists
  *
  * @return {Scraper} 
  *   This scraper
  */
  ifExistsNot: function(selector, callback) {
    this._addOperation(IfExists(selector, callback, true));
    return this;
  },

  /**
  * @see IfURLIs
  *
  * @return {Scraper} 
  *   This scraper
  */
  ifURLIs: function(pattern, callback) {
    this._addOperation(IfURLIs(pattern, callback, false));
    return this;
  },

  /**
  * @see IfURLIs
  *
  * @return {Scraper} 
  *   This scraper
  */
  ifURLIsNot: function(pattern, callback) {
    this._addOperation(IfURLIs(pattern, callback, true));
    return this;
  },

  /**
  * @see WaitForLoadingAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  waitForLoading: function() {
    this._addOperation(WaitForLoading());
    return this;
  },

  /**
  * @see WaitForElementAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  waitForElement: function(selector) {
    this._addOperation(WaitForElement(selector));
    return this;
  },

  /**
  * @see FillInAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  fillIn: function(selector, value) {
    this._addOperation(FillIn(selector, value));
    return this;
  },

  /**
  * A shortcut for `fillIn(selector, true)`
  *
  * @return {Scraper} 
  *   This scraper
  */
  check: function(selector) {
    return this.fillIn(selector, true);
  },
  /**
  * @see ClickOnAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  clickAndWait: function(selector) {
    this._addOperation(ClickOn(selector));
    this._addOperation(WaitForLoading());
    return this;
  },
  /**
  * @see SolveCaptchaAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  solveCaptcha: function(captchaImgSelector, captchaInputSelector) {
    this._addOperation(SolveCaptcha(captchaImgSelector, captchaInputSelector));
    return this;
  },

  /**
  * @see GetTextAction
  *
  * @return {Scraper}
  *   This scraper
  */
  getText: function(selector) {
    this._addOperation(GetText(selector));
    return this;
  },

  /**
  * @see GetValueAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  getValue: function(selector) {
    this._addOperation(GetValue(selector));
    return this;
  },

  /**
  * @see GetAttributeAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  getAttribute: function(selector, attribute) {
    this._addOperation(GetAttribute(selector, attribute));
    return this;
  },

  /**
  * @see Fail
  *
  * @return {Scraper} 
  *   This scraper
  */
  fail: function(reason) {
    this._addOperation(Fail(reason));
  },

  /**
  * Starts this scraper.
  * @return {Promise} 
  *   A promise that gets resolved when the scraping was successful,
  *   or rejected if there was an unhandled error.
  */
  run: function() {
    if(this._running) {
      throw new Error("This scraper is already running");
    }

    const self = this;

    this._running = true;
    this.results = [];

    console.log(TAG, "started");

    function next(success, failure) {
      console.log(TAG, "stack size = " + self._stack.length);

      if(self._stack.length) {
        var op = self._stack.shift();

        console.log(TAG, "running " + op.name);

        self._stackInsertIndex = 0;

        op.handler(self, function() {
          next(success, failure);
        }, failure);
      } else {
        console.log(TAG, "finished");
        self._running = false;
        success(self.results);
      }
    }

    return new Promise(next).catch(function(error) {
      self._running = false;
      self._tab.activate();
      self._stack = [];
      self._stackInsertIndex = 0;
      
      const style = Style({ uri: "./content.css" });
      attach(style, self._tab);

      self._worker.port.emit("showErrorDialog", error);
      self._tab.activate();

      return Promise.reject(error);
    });
  },

  /**
  * Destroys this scraper.
  * Closes the tab and frees memory.
  */
  destroy: function() {
    if(this._tab) {
      this._tab.close();
      this._tab = null;
    }

    if(this._worker) {
      this._worker.detach();
      this._worker = null; 
    }

    this._stack = [];
  },

  /**
  * Adds an Operation to the current stack.
  * The Operation gets inserted at the `_stackInsertIndex`.
  */
  _addOperation: function(operation) {
    console.log(TAG, "add operation: " + operation.name);
    this._stack.splice(this._stackInsertIndex, 0, operation);
    this._stackInsertIndex += 1; 
  }
});

exports.Scraper = Scraper;
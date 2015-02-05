const { setTimeout, clearTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");
const tabs = require("sdk/tabs");
const { attach } = require("sdk/content/mod");
const { Style } = require("sdk/stylesheet/style");

const TAG = "scraper:";


/**
* Base class for a scraper Action.
* An Action is a atomic command for the scraper.
* Each Action has a run method that invokes its asynchronous handler method.
* The `run` method returns a promise that gets resolved/rejected, once the handler is done.
* This is needed to queue and chain multiple actions.
*/
const Action = Class({

  /**
  * Creates a new Action.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {name} name 
  *   The name of this action
  */
  initialize: function(scraper, name) {
    this.scraper = scraper;
    this.name = name;
  },

  /**
  * This method must be overwritten.
  *
  * It contains the logic for the specific Action.
  * It will be called in the `run` method.
  *
  * @param {function} resolve 
  *   Called when the handler finished successfully
  * @param {function} reject 
  *   Called when the handler finished with an error
  */
  handler: function(resolve, reject) { // jshint ignore:line
    resolve();
  },

  /**
  * Starts this action.
  * 
  * @return {Promise} 
  *   Promise that gets resolved/rejected when the action is finished.
  */
  run: function() {
    return new Promise(this.handler.bind(this));
  }
});


/**
* The InitAction is the first default action in the scraper.
* It creates a new Tab and loads the content script. 
*/
const InitAction = Class({

  extends: Action,

  /**
  * Creates a new InitAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  */
  initialize: function(scraper) {
    Action.prototype.initialize.call(this, scraper, "init");
  },

  handler: function(resolve) {
    const self = this;

    tabs.open({
      url: this.scraper.url,
      onOpen: function(tab) {
        self.initTab(tab, resolve);
      }
    });
  },

  initTab: function(tab, resolve) {
    const self = this;

    this.scraper._tab = tab;

    tab.on("ready", function(tab) {
      console.log(TAG, "on " + tab.url);
      self.scraper.url = tab.url;
      self.scraper._worker = tab.attach({
        contentScriptFile: ["./scraper.js"]
      });
    });

    tab.once("ready", function() {
      //bugfix @see WaitForLoadingAction#handler
      setTimeout(resolve, 1);
    });
  }
});


/**
* The GoToAction loads a specific URL in the scraper tab.
*/
const GoToAction = Class({

  extends: Action,

  /**
  * Creates a new GoToAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} url 
  *   The URL to load
  */
  initialize: function(scraper, url) {
    Action.prototype.initialize.call(this, scraper, "goTo");
    this.url = url;
  },

  handler: function(resolve) {
    console.log(TAG, "Going to " + this.url);
    this.scraper._tab.url = this.url;
    resolve();
  }
});


/**
* The WaitForLoadingAcrion waits until the ready event is fired on the scraper tab.
*/
const WaitForLoadingAction = Class({

  extends: Action,

  maxTime: 5000,

  /**
  * Creates a new WaitForLoadingAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  */
  initialize: function(scraper) {
    Action.prototype.initialize.call(this, scraper, "waitForLoading");
  },

  handler: function(resolve, reject) {
    console.log(TAG, "Waiting for load");

    const self = this;

    const timeoutId = setTimeout(function() {
      self.scraper._tab.off("ready", onReadyHandler);
      console.error(TAG, "Timed out while waiting for page to load");
      reject("Timed out while waiting for page to load");
    }, this.maxTime);

    const onReadyHandler = function(tab) {
      console.log(TAG, "Loaded " + tab.url);

      clearTimeout(timeoutId);
      
      // bugfix
      // If this is the last action in the stack, firefox throws a
      // TypeError "can't access dead object"
      // The source of the error is unknown, but the timeout seems to prevent it
      setTimeout(function() {
        resolve(tab.url);
      }, 1);
    };

    this.scraper._tab.once("ready", onReadyHandler);
  }
});


/**
* The ExpectAction looks for a certain element.
* It will fail if the element doesn't exist.
*/
const ExpectAction = Class({

  extends: Action,

  /**
  * Creates a new ExpectAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the expected element
  */
  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "expect");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for " + this.selector);

    this.scraper._worker.port.emit("getElement", this.selector, this.attribute);

    this.scraper._worker.port.once("gotElement", function(error) {

      if (error) {
        console.log(TAG, "Expected to see " + self.selector);
        reject("Expected to see " + self.selector);
      } else {
        console.log(TAG, "Found " + self.selector);
        resolve();
      }
    });
  }
});


/**
* The GetTextAction gets the text content of an element.
* It will fail if the element doesn't exist.
*/
const GetTextAction = Class({

  extends: Action,

  /**
  * Creates a new GetTextAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the element with the text
  */
  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "getText");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for text in " + this.selector);

    this.scraper._worker.port.emit("getText", this.selector);

    this.scraper._worker.port.once("gotText", function(text, error) {
      if (error) {
        console.log(TAG, error);
        reject("Could not get text in " + self.selector);
      } else {
        console.log(TAG, "Got text: " + text);
        self.scraper.results.push(text);
        resolve(text);
      }
    });
  }
});


/**
* The GetValueAction gets the value of an element.
* It will fail if the element doesn't exist.
*/
const GetValueAction = Class({

  extends: Action,

  /**
  * Creates a new GetValueAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the element with the value
  */
  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "getValue");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for value in " + this.selector);

    this.scraper._worker.port.emit("getValue", this.selector);

    this.scraper._worker.port.once("gotValue", function(value, error) {
      if (error) {
        console.log(TAG, error);
        reject("Could not get value in " + self.selector);
      } else {
        console.log(TAG, "Got value: " + value);
        self.scraper.results.push(value);
        resolve(value);
      }
    });
  }
});


/**
* The FillInAction will fill a text into an input field.
* Fails if the input field doesn't exist. 
*/
const FillInAction = Class({

  extends: Action,

  /**
  * Creates a new FillInAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the input field 
  * @param {String} text 
  *   The text to fill in
  */
  initialize: function(scraper, selector, value) {
    Action.prototype.initialize.call(this, scraper, "fillIn");
    this.selector = selector;
    this.value = value;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Filling in value " + this.value + " in to " + this.selector);

    this.scraper._worker.port.emit("fillIn", this.selector, this.value);

    this.scraper._worker.port.once("filledIn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not fill in " + self.value + " into " + self.selector);
      } else {
        console.log(TAG, "Filled in value " + self.value + " in to " + self.selector);
        resolve();
      }
    });
  }
});


/**
* The ClickOnAction simulates a user click on an element.
* Fails if the element doesn't exist. 
*/
const ClickOnAction = Class({

  extends: Action,

  /**
  * Creates a new ClickOnAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the element to click on
  */
  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "clickOn");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Clicking on " + this.selector);

    this.scraper._worker.port.emit("clickOn", this.selector);

    this.scraper._worker.port.once("clickedOn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not click on " + self.selector);
      } else {
        console.log(TAG, "Clicked on " + self.selector);
        resolve();
      }
    });
  }
});


/**
* The GetAttributeAction gets the value of a specific attribute.
* Fails if the attribute or the element doesn't exist. 
*/
const GetAttributeAction = Class({

  extends: Action,


  /**
  * Creates a new GetAttributeAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} selector 
  *   The selector for the element with the attribute
  * @param {String} attribute
  *   The name of the attribute
  */
  initialize: function(scraper, selector, attribute) {
    Action.prototype.initialize.call(this, scraper, "getAttribute");
    this.selector = selector;
    this.attribute = attribute;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Getting attribute " + this.attribute + " on " + this.selector);

    this.scraper._worker.port.emit("getAttribute", this.selector, this.attribute);

    this.scraper._worker.port.once("gotAttribute", function(value, error) {

      if (error) {
        console.log(TAG, "Could not find attribute " + value);
        reject("Could not find attribute " + self.attribute + " on " + self.selector);
      } else {
        console.log(TAG, "Found attribute " + value);
        self.scraper.results.push(value);
        resolve(value);
      }
    });
  }
});


/**
* The SolveCaptchaAction enables the scraper to solve a captcha.
* Depending on the used captcha solver this can be done by the user or automatically.
*/
const SolveCaptchaAction = Class({

  extends: Action,


  /**
  * Creates a new SolveCaptchaAction.
  *
  * @param {Scraper} scraper 
  *   The scraper
  * @param {String} captchaImgSelector 
  *   The selector for the captcha img element
  * @param {String} captchaInputSelector
  *   The selector for the captcha text input element
  * @param {object} captchaSolver
  *   The captchaSolver to solve the captcha
  */
  initialize: function(scraper, captchaImgSelector, captchaInputSelector, captchaSolver) {
    Action.prototype.initialize.call(this, scraper, "solveCaptcha");
    this.captchaImgSelector = captchaImgSelector;
    this.captchaInputSelector = captchaInputSelector;
    this.captchaSolver = captchaSolver;
  },

  handler: function(resolve, reject) {
    const self = this;

    this.scraper._worker.port.emit("getAttribute", this.captchaImgSelector, "src");

    this.scraper._worker.port.once("gotAttribute", function(value, error) {

      if(error) {
        console.log(TAG, "Could not find captcha image :" + self.captchaImgSelector);
        reject("Could not find captcha image :" + self.captchaImgSelector);
      } else {
        console.log(TAG, "Found captcha image :" + value);

        self.scraper._captchaSolver.solveCaptcha(value).then(function(solution) {

          self.scraper._worker.port.emit("fillIn", self.captchaInputSelector, solution);

          self.scraper._worker.port.once("filledIn", function(error) {
            if(error) {
              console.log(TAG, "Could not find captcha input field: " + self.captchaInputSelector);
              reject("Could not find captcha input field: " + self.captchaInputSelector);
            } else {
              resolve(solution);
            }
          });

        }, reject);
      }
    });
  }
});


/**
* The WaitForElementAction waits until a specific element appears on the page.
* It gets rejected after a timeout.
*/
const WaitForElementAction = Class({

  extends: Action,

  /**
  * Creates a new WaitForElementAction
  *
  * @param {Scraper} scraper
  *   The scraper
  * @param {String} selector
  *   The selector for the element to wait for
  */
  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "waitForElement");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    console.log(TAG, "Waiting for element " + this.selector);

    const self = this;
    const time = 2000;

    var timeoutId = -1;

    this.scraper._worker.port.emit("waitForElement", this.selector, time);

    const handler = function(error) {
      console.log(TAG, "Waited for element " + this.selector);
      clearTimeout(timeoutId);

      //bugfix @see WaitForLoadingAction#handler
      setTimeout(function() {
        if(error) {
          console.log(TAG, "Timed out while waiting for element " + self.selector);
          reject("Timed out while waiting for element " + self.selector);
        } else {
          resolve();
        }
      }, 1);
    };

    this.scraper._worker.port.once("waitedForElement", handler);
  
    //set a second timeout independent to the content script
    //the content script could be unloaded so the event never gets fired
    timeoutId = setTimeout(function() {
      self.scraper._worker.port.off("waitedForElement", handler);
      console.log(TAG, "Timed out while waiting for element " + self.selector);
      reject("Timed out while waiting for element " + self.selector);
    }, time * 1.5);
  }
});


/**
* The ThenAction can be inserted after every other action.
* It allows to process the result of the previous actions while the scraper is running.
* It works like the `Promise.then` function.
* Also it allows to dynamically insert actions to the running scrapers stack.
*/
const ThenAction = Class({

  extends: Action,

  /**
  * Creates a new ThenAction
  *
  * @param {Scraper} scraper
  *   The scraper
  * @param {function} onResolve
  *   This function will get called, after the previous Action has been resolved
  * @param {function} onResolve
  *   This function will be called, after the previous Action has been rejected
  */
  initialize: function(scraper, onResolve, onReject) {
    Action.prototype.initialize.call(this, scraper, "then");
    this.onResolve = onResolve;
    this.onReject = onReject;

    this.scraper._stackInsertIndex -= 1;
    this.lastAction = this.scraper._stack.splice(this.scraper._stackInsertIndex, 1)[0];
  },

  run: function() {
    this.scraper._stackInsertIndex = 0;
    return this.lastAction.run().then(this.onResolve, this.onReject);
  }
});



const scraperContract = contract({
  url: {
    is: ["string"]
  },
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

    this.url = options.url;
    this.results = [];

    this._captchaSolver = options.captchaSolver;
    this._stack = [];
    this._stackInsertIndex = 0;

    this._addAction(InitAction(this));

    console.log(TAG, "new scraper on: " + this.url);
  },

  /**
  * @see GoToAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  goTo: function(url) {
    this._addAction(GoToAction(this, url));
    this._addAction(WaitForLoadingAction(this));
    return this;
  },

  /**
  * @see ExpectAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  expect: function(selector) {
    this._addAction(ExpectAction(this, selector));
    return this;
  },

  /**
  * @see WaitForLoadingAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  waitForLoading: function() {
    this._addAction(WaitForLoadingAction(this));
    return this;
  },

  /**
  * @see WaitForElementAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  waitForElement: function(selector) {
    this._addAction(WaitForElementAction(this, selector));
    return this;
  },

  /**
  * @see FillInAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  fillIn: function(selector, value) {
    this._addAction(FillInAction(this, selector, value));
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
  clickOn: function(selector) {
    this._addAction(ClickOnAction(this, selector));
    return this;
  },
  /**
  * @see SolveCaptchaAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  solveCaptcha: function(captchaImgSelector, captchaInputSelector) {
    this._addAction(SolveCaptchaAction(this, captchaImgSelector, captchaInputSelector));
    return this;
  },

  /**
  * @see GetTextAction
  *
  * @return {Scraper}
  *   This scraper
  */
  getText: function(selector) {
    this._addAction(GetTextAction(this, selector));
    return this;
  },

  /**
  * @see GetValueAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  getValue: function(selector) {
    this._addAction(GetValueAction(this, selector));
    return this;
  },

  /**
  * @see GetAttributeAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  getAttribute: function(selector, attribute) {
    this._addAction(GetAttributeAction(this, selector, attribute));
    return this;
  },

  /**
  * @see ThenAction
  *
  * @return {Scraper} 
  *   This scraper
  */
  then: function(onResolve, onReject) {
    this._addAction(ThenAction(this, onResolve, onReject));
    return this;
  },

  /**
  * A shortcut for then(null, onReject)`
  *
  * @return {Scraper} 
  *   This scraper
  */
  catch: function(onReject) {
    return this._addAction(ThenAction(this, null, onReject));
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

    function runAction() {
      console.log(TAG, "stack size = " + self._stack.length);

      if(self._stack.length) {
        var action = self._stack.shift();

        console.log(TAG, "running " + action.name);

        if(self._stackInsertIndex > 0) {
          self._stackInsertIndex -= 1;
        }

        return action.run().then(runAction);
      } else {
        console.log(TAG, "finished");
        self._running = false;
        return self.results;
      }
    }

    return runAction().catch(function(error) {
      self._running = false;
      self._tab.activate();
      self._stack = [];
      self._stackInsertIndex = 0;
      
      const style = Style({ uri: "./content.css" });
      attach(style, self._tab);

      self._worker.port.emit("showErrorDialog", error);
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
  * Adds an action to the current stack.
  * The action gets inserted at the `_stackInsertIndex`.
  */
  _addAction: function(action) {
    console.log(TAG, "add action: " + action.name);
    this._stack.splice(this._stackInsertIndex, 0, action);
    this._stackInsertIndex += 1; 
  }
});

exports.Scraper = Scraper;
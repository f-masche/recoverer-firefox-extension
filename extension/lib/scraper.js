const { Page } = require("sdk/page-worker"); 
const { setTimeout, clearTimeout } = require("sdk/timers");


const TAG = "scraper:";

function ScraperFactory(url, captchaSolver) {

  console.log("new scraper on: " + url);

  let stack = [];

  let resultMap = {};

  let running = false;

  let currentUrl = url;

  const worker = Page({
    contentScriptFile: "./scraper.js",
    contentURL: url,
    contentScriptWhen: "ready"
  }); 


  worker.port.on("loaded", function(url) {
    currentUrl = url;
  });

  //wait for initial loading
  createWaitForLoadingAction();


  function createClickOnAction(selector) {

    stack.push(function(resolve, reject) {

      console.log("scraper: clicking on " + selector);

      worker.port.emit("clickOn", selector);

      worker.port.once("clickedOn", function(error) {

        if(error) {
          console.log(TAG, error);
          reject("Could not click on " + selector);
        } else {
          console.log(TAG, "clicked on " + selector);

          resolve();
        }
      });
    });

    return this;
  }

  function createFindTextAction(selector, resultKey) {

    stack.push(function(resolve, reject) {
      console.log("scraper: searching text in " + selector);

      worker.port.emit("findText", selector);

      worker.port.once("foundText", function(text, error) {

        if(error) {
          console.log(TAG, error);
          reject("Could not find text in " + selector);
        } else {
          console.log(TAG, "found text: " + text);
          resultMap[resultKey] = text;
          resolve(text);
        }
      });
    });

    return this;
  }

  function createFindAttributeAction(selector, attributeName, resultKey) {

    stack.push(function(resolve, reject) {
      console.log("scraper: searching attribute " + attributeName + " on " + selector);

      worker.port.emit("findAttribute", selector, attributeName);

      worker.port.once("foundAttribute", function(value, error) {

        if(error) {
          console.log(TAG, "could not find attribute " + value);
          reject("Could not find attribute " + attributeName + " on " + selector);
        } else {
          console.log(TAG, "found attribute " + value);
          resultMap[resultKey] = value;
          resolve(value);
        }
      });
    });

    return this;
  }

  function createFillInAction(selector, value) {

    stack.push(function(resolve, reject) {
      fillInHandler(resolve, reject, selector, value);
    });

    return this;
  }

  function fillInHandler(resolve, reject, selector, value) {
    console.log("scraper: filling in value " + value + " in to " + selector);

    worker.port.emit("fillIn", selector, value);

    worker.port.once("filledIn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not fill in " + value + " into " + selector);
      } else {
        console.log(TAG, "filled in value " + value + " in to " + selector);
        resolve();
      }
    });
  }

  function createCheckAction(selector) {
    createFillInAction(selector, true);
    return this;
  }

  function createSolveCaptchaAction(captchaImgSelector, captchaInputSelector) {

    createFindAttributeAction(captchaImgSelector, "src", "_captchaSrc");

    stack.push(function(resolve, reject) {
      captchaSolver.solveCaptcha(resultMap._captchaSrc)
        .then(function(solution) {
          resultMap._captchaSolution = solution;
          resolve();
        }, reject);
    });

    stack.push(function(resolve, reject) {
      fillInHandler(resolve, reject, captchaInputSelector, resultMap._captchaSolution);
    });

    return this;
  }

  function createWaitForLoadingAction() {

    stack.push(function(resolve, reject) {
      console.log("scraper: waiting for load");

      const timeoutId = setTimeout(function() {
        console.error(TAG, "timed out while waiting for page to load");
        reject("Timed out while waiting for page to load");
      }, 5000);

      worker.port.once("loaded", function(url) {
        console.log(TAG, "loaded " + url);
        clearTimeout(timeoutId);
        resolve(url);
      });
    });

    return this;
  }

  function createWaitForElementAction(selector, timeout) {

    stack.push(function(resolve, reject) {
      console.log(TAG, "waiting for element " + selector);
      let timeoutId = -1;

      worker.port.emit("waitForElement", selector);

      const handler = function(error) {
        console.log(TAG, "waited for element " + selector);
        clearTimeout(timeoutId);

        if(error) {
          console.log(TAG, "timed out while waiting for element " + selector);
          reject("Timed out while waiting for element " + selector);
        } else {
          resolve();
        }
      };

      worker.port.once("waitedForElement", handler);
    
      //set a second timeout independent to the content script
      //the content script could be unloaded so the event never gets fired
      timeoutId = setTimeout(function() {
        worker.port.off("waitedForElement", handler);
        console.log(TAG, "timed out while waiting for element " + selector);
        reject("Timed out while waiting for element " + selector);
      }, timeout);
    });

    return this;
  }

  function run() {
    if(running) {
      throw new Error("This scraper is already running");
    }

    running = true;
    console.log(TAG, "started");

    function runAction() {
      console.log(TAG, "stack size = " + stack.length);

      if(stack.length) {
        let action = stack.shift();
        return new Promise(action).then(runAction);
      } else {
        console.log(TAG, "finished");
        let result = Promise.resolve(resultMap);
        resultMap = {};
        running = false;
        return result;
      }
    }

    return runAction();
  }

  return {
    clickOn: createClickOnAction,
    fillIn: createFillInAction,
    check: createCheckAction,
    waitForLoading: createWaitForLoadingAction,
    waitForElement: createWaitForElementAction,
    findText: createFindTextAction,
    findAttribute: createFindAttributeAction,
    solveCaptcha: createSolveCaptchaAction,
    getCurrentUrl: function() {
      return currentUrl;
    },
    getCurrentResults: function() {
      return resultMap;
    },
    run: run,
    then: function(resolved, rejected) {
      const action = stack.pop();
      stack.push(function(resolve, reject) {
        new Promise(action)
          .then(resolved, rejected)
          .then(resolve, reject);
      });
    }
  };
}

exports.Scraper = ScraperFactory;
const { isArray } = require("sdk/lang/type");
const { Task } = require("task");


function fromJSON(json) {

  const resetPassword = function(scraper, email) {
    json.resetPassword.forEach(function(part) {
      handleFillIn(scraper, part.email, email);
      handleFillIn(scraper, part.checkbox, true);
      handleCaptcha(scraper, part.captcha);
      handleSubmit(scraper, part.submit);
    });
  };

  const setNewPassword = function(scraper, password) {
    handleFillIn(scraper, json.setNewPassword.password, password);
    handleFillIn(scraper, json.checkbox, true);
    handleCaptcha(scraper, json.setNewPassword.captcha);
    handleSubmit(scraper, json.setNewPassword.submit);
  };

  const login = function(scraper, email, password) {
    if(isArray(json.login)) {
      json.login.forEach(function(part) {
        handleEmail(scraper, part.email, email);
        handleFillIn(scraper, part.password, password);
        handleFillIn(scraper, part.checkbox, true);
        handleCaptcha(scraper, part.captcha);
        handleSubmit(scraper, part.submit);
      });
    } else {
      handleEmail(scraper, json.login.email, email);
      handleFillIn(scraper, json.login.password, password);
      handleFillIn(scraper, json.login.checkbox, true);
      handleCaptcha(scraper, json.login.captcha);
      handleSubmit(scraper, json.login.submit); 
    }

  };

  return Task({
    loginUrl: json.loginUrl,
    loginUrlPattern: new RegExp(json.loginUrlPattern),
    emailLinkPattern: new RegExp(json.emailLinkPattern, "g"),
    name: json.name,
    messageFilters: json.emailFilters,
    resetPassword: resetPassword,
    setNewPassword: setNewPassword,
    login: login
  });
}

function handleEmail(scraper, emailSelector, email) {
  if(emailSelector) {
    scraper.fillIn(emailSelector, email);
  }
}

function handleCaptcha(scraper, captcha) {
  if(captcha) {
    scraper.solveCaptcha(captcha.image, captcha.input);
  }
}

function handleFillIn(scraper, selector, value) {
  if(selector) {
    if(isArray(selector)) {
      for(let i = 0; i < selector.length; i++) {
        scraper.fillIn(selector[i], value);
      }
    } else {
      scraper.fillIn(selector, value);
    }
  }
}

function handleSubmit(scraper, submitSelector) {
  if(submitSelector) {
    scraper.clickOn(submitSelector);
    scraper.waitForLoading();
  }
}

exports.fromJSON = fromJSON;
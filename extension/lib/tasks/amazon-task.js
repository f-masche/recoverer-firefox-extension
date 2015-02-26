const { Task } = require("tasks/task");
const { Class } = require("sdk/core/heritage");

const AmazonTask = Class({
  extends: Task,

  initialize: function() {
    Task.prototype.initialize.call(this);
  },

  //start on main page cause of complicated sign in url
  loginUrl: "http://www.amazon.de/",

  loginUrlPattern: /^https:\/\/www\.amazon\.de\/ap\/signin.*/,

  resetLinkPattern: /https:\/\/www\.amazon\.de\/ap\/forgotpassword\S+/,

  name: "amazon",

  emailFilters: {
    from: "konto-aktualisierung@amazon.de", 
    subject: "passworthilfe"
  },

  resetPassword: function(scraper, email) {
    scraper.ifExistsNot("#nav-flyout-ya-signin a", function() {
      scraper.fail("Already logged in");
    });

    scraper.clickAndWait("#nav-flyout-ya-signin a");

    scraper.ifExistsNot("#ap_small_forgot_password_span a", function() {
        //no password reset link, so there is a bot check
        scraper.solveCaptcha("form img", "input[type=text]");
        scraper.clickAndWait("button[type=submit]");
      });
      
    scraper.clickAndWait("#ap_small_forgot_password_span a")
      .fillIn("#ap_email", email)
      .solveCaptcha("#ap_captcha_img > img", "#ap_captcha_guess")
      .clickAndWait("#continue-input");
  },

  setNewPassword: function(scraper, password) {
    scraper.ifExistsNot("input[name=password]", function() {
        //there is another bot check
        scraper.solveCaptcha("form img", "input[type=text]");
        scraper.clickAndWait("button[type=submit]");
      });
      
    scraper.fillIn("input[name=password]", password)
      .fillIn("input[name=passwordCheck]", password)
      .clickAndWait("input[type=submit]");
  },

  login: function(scraper, email, password) {
    scraper.clickAndWait("#nav-flyout-ya-signin a")
      .fillIn("#ap_email", email)
      .check("#ap_signin_existing_radio")
      .fillIn("#ap_password", password)
      .clickAndWait("#signInSubmit-input");

    scraper.ifExists("#ap_captcha_img", function() {
        //amazon wants to see that we are no bot again
        scraper.fillIn("#ap_email", email)
          .check("#ap_signin_existing_radio")
          .fillIn("#ap_password", password)
          .solveCaptcha("#ap_captcha_img > img", "#ap_captcha_guess")
          .clickAndWait("#signInSubmit-input");
      });
  }
});

exports.task = AmazonTask;
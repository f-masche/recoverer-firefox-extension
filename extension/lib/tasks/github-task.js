const { Task } = require("tasks/task");
const { Class } = require("sdk/core/heritage");

const GithubTask = Class({
  extends: Task,

  initialize: function() {
    Task.prototype.initialize.call(this);
  },

  loginUrl: "https://www.github.com/login",

  loginUrlPattern: /^https:\/\/github\.com\/login\/?$/,

  resetLinkPattern: /https:\/\/github\.com\/password_reset\S+/,

  name: "Github",

  emailFilters: {
    from: "noreply@github.com", 
    subject: "github reset password"
  },

  resetPassword: function(scraper, email) {
    scraper.ifExistsNot("#login", function() {
      scraper.fail("Already logged in");
    });
      
    scraper.clickAndWait("#login label[for=password] a")
      .fillIn("#email_field", email)
      .clickAndWait("#forgot_password_form input[type=submit]");
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("#password", password)
      .fillIn("#password_confirmation", password)
      .clickAndWait(".auth-form-body input[type=submit]");
  },

  login: function(scraper, email, password) {
    scraper.fillIn("#login_field", email)
      .fillIn("#password", password)
      .clickAndWait("#login .auth-form-body input[type=submit]");
  }
});


exports.task = GithubTask;
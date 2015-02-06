const { Task } = require("tasks/task");

const githubTask = Task({

  loginUrl: "https://www.github.com/login",

  loginUrlPattern: /^https:\/\/github\.com\/login\/?$/,

  resetLinkPattern: /https:\/\/github\.com\/password_reset\S+/,

  name: "Github",

  emailFilters: {
    from: "noreply@github.com", 
    subject: "github reset password"
  },

  resetPassword: function(scraper, email) {
    scraper.clickOn("#login label[for=password] a")
      .waitForLoading()
      .fillIn("#email_field", email)
      .clickOn("#forgot_password_form input[type=submit]")
      .waitForLoading().then(function (){
        //everything worked so far

        //check if there is an error message
        scraper.getText(".flash-error").then(Promise.reject, Promise.resolve);       
      });
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("#password", password)
      .fillIn("#password_confirmation", password)
      .clickOn(".auth-form-body input[type=submit]");
  },

  login: function(scraper, email, password) {
    scraper.fillIn("#login_field", email)
      .fillIn("#password", password)
      .clickOn("#login .auth-form-body input[type=submit]")
      .waitForLoading();
  }
});


exports.task = githubTask;
const { Task } = require("tasks/task");

const twitterTask = Task({

  loginUrl: "https:\/\/twitter.com\/login",

  loginUrlPattern: /^https:\/\/twitter\.com(\/login)?\/?$/,

  loginUrlSelector: "input[name='session[username_or_email]']",

  resetLinkPattern: /https:\/\/twitter\.com\/account\/confirm_email_reset?\S+/,

  name: "twitter",

  emailFilters: {
    from: "password@twitter.com", 
    subject: "passwort zurücksetzen"
  },

  resetPassword: function(scraper, email) {
    scraper.clickAndWait("a.forgot")
      .fillIn("input[name=account_identifier]", email)
      .clickAndWait("input[type=submit]")
      .check("input[value=email] + input[type=radio]")
      .clickAndWait("input[type=submit]");
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("input[name=password]", password)
      .fillIn("input[name=password_confirmation]", password)
      .clickAndWait("input[type=submit]");
  },

  login: function(scraper, email, password) {   // jshint ignore:line

    //already logged in

    // scraper.fillIn("input[name='session[username_or_email]']", email)
    //   .fillIn("input[name='session[password]']", password)
    //   .clickOn("button[type=submit]")
    //   .waitForLoading();
  }
});


exports.task = twitterTask;
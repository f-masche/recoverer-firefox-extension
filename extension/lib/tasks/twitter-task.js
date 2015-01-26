const { Task } = require("tasks/task");

const twitterTask = Task({

  loginUrl: "https:\/\/twitter.com\/login",

  loginUrlPattern: /^https:\/\/twitter\.com(\/login)?\/?$/,

  loginUrlSelector: "input[name='session[username_or_email]']",

  resetLinkPattern: /https:\/\/twitter\.com\/account\/confirm_email_reset?\S+/,

  name: "twitter",

  messageFilters: {
    from: "password@twitter.com", 
    subject: "passwort zurücksetzen"
  },

  resetPassword: function(scraper, email) {
    scraper.clickOn("a.forgot")
      .waitForLoading()
      .fillIn("input[name=account_identifier]", email)
      .clickOn("input[type=submit]")
      .waitForLoading()
      .check("input[value=email] + input[type=radio]")
      .clickOn("input[type=submit]");
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("input[name=password]", password)
      .fillIn("input[name=password_confirmation]", password)
      .clickOn("input[type=submit]")
      .waitForLoading();
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
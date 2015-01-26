const { Task } = require("tasks/task");

const facebookTask = Task({

  loginUrl: "https://facebook.com",

  loginUrlPattern: /^https:\/\/www\.facebook\.com\/\?*/,

  loginUrlSelector: "#login_form",

  resetLinkPattern: /https:\/\/www\.facebook\.com\/recover\/code\?[a-z0-9=&]*/g,

  name: "facebook",

  messageFilters: {
    from: "@facebookmail.com",
    subject: "neues passwort angefragt"
  },

  resetPassword: function(scraper, email) {

    scraper.clickOn(".login_form_label_field > a");

    scraper.waitForLoading().then(function(url) {

        if(url.match(/https:\/\/www.facebook.com\/recover\/initiate/)) {
          //facebook cached our email
          scraper.clickOn("a[href^='/notme.php']")
            .waitForLoading();
        }

        scraper.fillIn("#identify_yourself_flow input[type=text]", email)
          .clickOn("#identify_yourself_flow input[name=did_submit]")
          .waitForLoading()
          .check("input[type=radio][value=send_email]")
          .clickOn("input[type=submit][name=reset_action]");
          
        scraper.waitForElement("#captcha", 5000).then(function() {
          //facebook wants a captcha
          scraper.solveCaptcha("#captcha img", "#captcha_response")
            .clickOn("#captcha_dialog_submit_button"); 
        }, function() {
          //no error
          return Promise.resolve();
        });
      });
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("input[name=password_new]", password)
      .fillIn("input[name=password_confirm]", password)
      .check("input[type=radio][value=keep_sessions]")
      .clickOn("input[name=btn_continue]");
  },

  login: function(scraper, email, password) {   // jshint ignore:line
    //already logged in after password reset
    scraper.fillIn("#login_form input[name=email]", email)
      .fillIn("#login_form input[name=pass]", password)
      .clickOn("#login_form input[type=submit]")
      .waitForLoading();
  }
});

exports.task = facebookTask;
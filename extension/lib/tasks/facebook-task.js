const { Task } = require("tasks/task");

const facebookTask = Task({

  loginUrl: "https://facebook.com",

  loginUrlPattern: /^https:\/\/www\.facebook\.com\/\?*/,

  loginUrlSelector: "#login_form",

  resetLinkPattern: /https:\/\/www\.facebook\.com\/recover\/code\?[a-z0-9=&]*/g,

  name: "facebook",

  emailFilters: {
    from: "@facebookmail.com",
    subject: "neues passwort angefragt"
  },

  resetPassword: function(scraper, email) {

    scraper.clickAndWait(".login_form_label_field > a");

    scraper.ifURLIs(/https:\/\/www.facebook.com\/recover\/initiate/, function() {
        //facebook cached our email
        scraper.clickOn("a[href^='/notme.php']")
          .waitForLoading();
      });

    scraper.fillIn("#identify_yourself_flow input[type=text]", email)
      .clickAndWait("#identify_yourself_flow input[name=did_submit]")
      .check("input[type=radio][value=send_email]")
      .clickAndWait("input[type=submit][name=reset_action]");
          
    scraper.waitForElement("#captcha", 2000);

    scraper.ifExists("#captcha", function() {
        //facebook wants a captcha
        scraper.solveCaptcha("#captcha img", "#captcha_response")
          .clickAndWait("#captcha_dialog_submit_button"); 
      });
  },

  setNewPassword: function(scraper, password) {
    scraper.fillIn("input[name=password_new]", password)
      .fillIn("input[name=password_confirm]", password)
      .check("input[type=radio][value=keep_sessions]")
      .clickAndWait("input[name=btn_continue]");
  },

  login: function(scraper, email, password) { //jshint ignore:line
    //already logged in
    //scraper.fillIn("#login_form input[name=email]", email)
    //  .fillIn("#login_form input[name=pass]", password)
    //  .clickAndWait("#login_form input[type=submit]");
  }
});


exports.task = facebookTask;
const { Task } = require("tasks/task");

const amazonTask = Task({

  //start on main page cause of complicated sign in url
  loginUrl: "http://www.amazon.de/",

  loginUrlPattern: /^https:\/\/www\.amazon\.de\/ap\/signin.*/,

  resetLinkPattern: /https:\/\/www\.amazon\.de\/ap\/forgotpassword\S+/,

  name: "amazon",

  messageFilters: {
    from: "konto-aktualisierung@amazon.de", 
    subject: "passworthilfe"
  },

  resetPassword: function(scraper, email) {

    scraper.clickOn("#nav-flyout-ya-signin a")
      .waitForLoading()
      .expect("#ap_small_forgot_password_span a")
      .catch(function() {
        //no password reset link, so there is a bot check
        scraper.solveCaptcha("form img", "input[type=text]");
        scraper.clickOn("button[type=submit]");
        scraper.waitForLoading();
      })
      .clickOn("#ap_small_forgot_password_span a")
      .waitForLoading()
      .fillIn("#ap_email", email)
      .solveCaptcha("#ap_captcha_img > img", "#ap_captcha_guess")
      .clickOn("#continue-input");
  },

  setNewPassword: function(scraper, password) {
    scraper.expect("input[name=password]")
      .catch(function() {
        //there is another bot check
        scraper.solveCaptcha("form img", "input[type=text]");
        scraper.clickOn("button[type=submit]");
        scraper.waitForLoading();
      })
      .fillIn("input[name=password]", password)
      .fillIn("input[name=passwordCheck]", password)
      .clickOn("input[type=submit]");
  },

  login: function(scraper, email, password) {
    scraper.clickOn("#nav-flyout-ya-signin a")
      .waitForLoading()
      .fillIn("#ap_email", email)
      .check("#ap_signin_existing_radio")
      .fillIn("#ap_password", password)
      .clickOn("#signInSubmit-input")
      .waitForLoading().then(function(url) {

        if(url === "https://www.amazon.de/ap/signin") {
          //amazon wants to see that we are no bot
          scraper.fillIn("#ap_email", email)
            .check("#ap_signin_existing_radio")
            .fillIn("#ap_password", password)
            .solveCaptcha("#ap_captcha_img > img", "#ap_captcha_guess")
            .clickOn("#signInSubmit-input")
            .waitForLoading();
        }
      });
  }
});

exports.task = amazonTask;
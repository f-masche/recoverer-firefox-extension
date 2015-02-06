const { Task } = require("tasks/task");

const amazonTask = Task({

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
    var self = this;

    return scraper.run(function() {
      this.goTo(self.loginUrl);
      this.getElement("#nav-flyout-ya-signin a").click();
      this.waitForLoading();
      this.ifElement("#ap_small_forgot_password_span a").not().exists(function() {
        this.solveCaptcha("form img", "input[type=text]");
        this.getElement("button[type=submit]").click();
        this.waitForLoading();  
      });
      this.getElement("#ap_small_forgot_password_span a").click();
      this.waitForLoading();
      this.getElement("#ap_email").fillIn(email);
      this.solveCaptcha("#ap_captcha_img > img", "#ap_captcha_guess");
      this.getElement("#continue-input").click();
    });
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
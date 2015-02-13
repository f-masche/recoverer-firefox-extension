const { Task } = require("tasks/task");
const { Class } = require("sdk/core/heritage");

const AutoTask = Class({
  extends: Task,

  initialize: function() {
    Task.prototype.initialize.call(this);
  },

  loginUrl: "about:blank",

  loginUrlPattern: /.*/,

  loginUrlSelector: "*[data-recoverer-start]",

  resetLinkPattern: /.*/,

  name: "auto",

  emailFilters: {
    from: "", 
    subject: ""
  },

  resetPassword: function(scraper, email) {
    const self = this;

    //process start attributes
    scraper.waitForElement("*[data-recoverer-start]");
    scraper.getAttribute("*[data-recoverer-start]", "data-recoverer-email-subject");
    scraper.getAttribute("*[data-recoverer-start]", "data-recoverer-email-sender");
    scraper.getAttribute("*[data-recoverer-start]", "data-recoverer-email-link");

    scraper.then(function(results) {
      self.emailFilters.subject = results[0];
      self.emailFilters.from = results[1];
      self.resetLinkPattern = new RegExp(results[2]);
    });

    scraper.clickAndWait("*[data-recoverer-start]");

    const process =  function() {

      scraper.ifExists("*[data-recoverer-end]", function() {
        scraper.getAttribute("*[data-recoverer-end]", "data-recoverer-end").then(function(result) {
          const status = result.pop();
          if(status === "error") {
            scraper.fail();
          }
        });
      });

      scraper.ifExistsNot("*[data-recoverer-end]", function() {

        scraper.ifExists("input[data-recoverer=email]", function(){
          scraper.fillIn("input[data-recoverer=email]", email);
        });

        scraper.ifExists("input[data-recoverer=check]", function(){
          scraper.check("input[data-recoverer=check]");
        });

        scraper.ifExists("input[data-recoverer=check]", function(){
          scraper.check("input[data-recoverer=check]");
        });

        scraper.ifExists("*[data-recoverer=submit]", function() {
          scraper.clickAndWait("*[data-recoverer=submit]");
          process();
        });
      });
    };

    process();

  },

  setNewPassword: function(scraper, password) {
    const process =  function() {

      scraper.ifExists("*[data-recoverer-end]", function() {
        scraper.getAttribute("*[data-recoverer-end]", "data-recoverer-end").then(function(result) {
          const status = result.pop();
          if(status === "error") {
            scraper.fail();
          }
        });
      });

      scraper.ifExistsNot("*[data-recoverer-end]", function() {

        scraper.ifExists("input[data-recoverer=password]", function(){
          scraper.fillIn("input[data-recoverer=password]", password);
        });

        scraper.ifExists("input[data-recoverer=check]", function(){
          scraper.check("input[data-recoverer=check]");
        });

        scraper.ifExists("*[data-recoverer=submit]", function() {
          scraper.clickAndWait("*[data-recoverer=submit]");
          process();
        });
      });
    };

    process();
  },

  login: function(scraper, email, password) {
    const process =  function() {

      scraper.ifExists("*[data-recoverer-end]", function() {
        scraper.getAttribute("*[data-recoverer-end]", "data-recoverer-end").then(function(result) {
          const status = result.pop();
          if(status === "error") {
            scraper.fail();
          }
        });
      });

      scraper.ifExistsNot("*[data-recoverer-end]", function() {

        scraper.ifExists("input[data-recoverer=password]", function(){
          scraper.fillIn("input[data-recoverer=password]", password);
        });

        scraper.ifExists("input[data-recoverer=email]", function(){
          scraper.fillIn("input[data-recoverer=email]", email);
        });

        scraper.ifExists("*[data-recoverer=submit]", function() {
          scraper.clickAndWait("*[data-recoverer=submit]");
          process();
        });
      });
    };

    process();
  }
});

exports.task = AutoTask();
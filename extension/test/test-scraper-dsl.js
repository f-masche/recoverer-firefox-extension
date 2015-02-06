const { Scraper } = require("scraper/scraper-dsl");
const self = require("sdk/self");


exports["test scraper dsl"] = function(assert, done) {
  Scraper().run(function() {

    this.goTo(self.data.url("./test-1.html"));
    
    this.whenElement("foo").exists(function() {
      this.goTo(self.data.url("./test-2.html"));
    });

    this.goTo(self.data.url("./test-1.html"));

  }).then(function() {
    assert.pass();
    done();
  }, function(error) {
    console.log(error, error.message, error.stack);
  });
};

require("sdk/test").run(exports);

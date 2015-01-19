var { Scraper } = require("scraper");
var self = require("sdk/self");


exports["test scraper should run"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.run().then(function() {
    assert.pass();
    done();
  });
};


exports["test scraper should find text"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findText("#text", "text");
  
  scraper.run().then(function(result) {
    assert.ok(result.text === "test 1");
    done();
  });
};


exports["test scraper should fail finding text"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findText("#nothing", "text");

  scraper.run().catch(function(error) {
    console.log("fail", error);
      assert.ok(error);
      done();
    });
};

exports["test scraper should find attribute"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findAttribute("a", "href", "link");
  
  scraper.run().then(function(result) {
    assert.equal(result.link, "test-2.html");
    done();
  });
};


exports["test scraper should fail finding attribute"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findAttribute("body", "href", "link");

  scraper.run().catch(function(error) {
      assert.ok(error);
      done();
    });
};

exports["test scraper should follow link "] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.clickOn("a");

  scraper.waitForLoading();

  scraper.findText("#text", "text");

  scraper.run().then(function(result) {
      assert.equal(result.text, "test 2");
      done();
    });
};


exports["test scraper should fail clicking"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.clickOn("#nothing");

  scraper.run()
    .catch(function(error) {
      assert.ok(error);
      done();
    });
};


exports["test scraper should wait for element"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.waitForElement("#text", 1000);

  scraper.run()
    .then(function() {
      assert.ok(true);
      done();
    });
};

exports["test scraper should timeout waiting for element"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.waitForElement("#nothing", 1000);

  scraper.run()
    .catch(function(error) {
      assert.ok(error);
      done();
    });
};

exports["test scraper should call then after the last instruction"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findText("#text")
    .then(function(text) {
      assert.ok(text === "test 1");
      done();
    });

  scraper.run();
};


exports["test scraper should find text and follow link"] = function(assert, done) {
  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.findText("#text", "text1");

  scraper.clickOn("a");

  scraper.waitForLoading();

  scraper.findText("#text", "text2");

  scraper.run().then(function(result) {
    assert.ok(result.text1 === "test 1" && result.text2 === "test 2");
    done();
  }); 
};

exports["test scraper should return current url"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.clickOn("a");
  scraper.waitForLoading();

  scraper.run()
    .then(function() {
      assert.equal(scraper.getCurrentUrl(), self.data.url("test-2.html"));
      done();
    });
};

require("sdk/test").run(exports);

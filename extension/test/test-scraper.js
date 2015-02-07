const { Scraper } = require("util/scraper");
const self = require("sdk/self");

const captchaSolver = {
  solveCaptcha: function() {
    return Promise.resolve("secret");
  }
};

exports["test scraper should run"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.run().then(function() {
    assert.pass();
    scraper._tab.close();
    done();
  });
};


exports["test scraper should fail"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));
  scraper.fail("error");
  
  scraper.run().catch(function(error) {
    assert.equal(error, "error");
    scraper._tab.close();
    done();
  });
};


exports["test scraper should find text"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.getText("#text-1");
  scraper.getText("#text-2");
  scraper.getText("#text-3");


  scraper.run().then(function(result) {
    assert.equal(result[0], "text 1");
    assert.equal(result[1], "text 2");
    assert.equal(result[2], "text 3");

    scraper._tab.close();
    done();
  });
};

exports["test scraper should follow link "] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.clickAndWait("a");

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};

exports["test scraper the reject callback should be called"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.clickAndWait("foo");

  scraper.run().catch(function() {
    scraper._tab.close();
    assert.pass();
    done();
  });
};


exports["test scraper should fail getting text"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.getText("#nothing");

  scraper.run().catch(function(error) {
      assert.ok(error);
      scraper._tab.close();
      done();
    });
};

exports["test scraper should navigate to page 2"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.ifExistsNot ("foo", function() {
    scraper.clickAndWait("a");
  });
  
  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};


exports["test scraper should navigate to page 2"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.ifExists("#page", function() {
    scraper.clickAndWait("a");
  });
  
  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};


exports["test scraper should wait for element"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.waitForElement("#dynamic", 1000);
  scraper.clickAndWait("#dynamic");

  scraper.run()
    .then(function() {
      assert.pass();
      scraper._tab.close();
      done();
    });
};

exports["test scraper should fail after waiting for element"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.waitForElement("#nothing", 1000);
  scraper.clickAndWait("#nothing");

  scraper.run()
    .catch(function(error) {
      assert.ok(error);
      scraper._tab.close();
      done();
    });
};


exports["test scraper should fill in a value"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.fillIn("input[type=text]", "password");

  scraper.getValue("input[type=text]");

  scraper.run().then(function(results) {
    assert.equal("password", results[0]);

    scraper._tab.close();
    done();
  });
};


exports["test scraper should fail filling in a value"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.fillIn("input[type=password]", "password");

  scraper.run().catch(function(error) {
    assert.ok(error);
    scraper._tab.close();    
    done();
  });
};


exports["test scraper should solve a captcha"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.solveCaptcha("img", "input[type=text]");

  scraper.getValue("input[type=text]");

  scraper.run().then(function(results) {
    assert.equal("secret", results[0]);

    scraper._tab.close();
    done();
  });
};


exports["test scraper should check a checkbox"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.check("input[type=checkbox]");

  scraper.getValue("input[type=checkbox]");

  scraper.run().then(function(result) {
    assert.equal("on", result[0]);
    scraper._tab.close();
    done();
  });
};


exports["test scraper should click link is url matches"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.ifURLIs(self.data.url("./test-1.html"),  function() {
    scraper.clickAndWait("a");
  });

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};

exports["test scraper shouldn't click link"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.ifURLIs("mozilla.com",  function() {
    scraper.clickAndWait("a");
  });

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-1.html"));
    scraper._tab.close();
    done();
  });
};

exports["test scraper should click link if url matches not"] = function(assert, done) {

  const scraper = Scraper({
    captchaSolver: captchaSolver
  });

  scraper.goTo(self.data.url("./test-1.html"));

  scraper.ifURLIsNot(self.data.url("./test-2.html"),  function() {
    scraper.clickAndWait("a");
  });

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};
require("sdk/test").run(exports);

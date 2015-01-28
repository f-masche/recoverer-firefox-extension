const { Scraper } = require("util/scraper");
const tabs = require("sdk/tabs");
const self = require("sdk/self");

const captchaSolver = {
  solveCaptcha: function() {
    return Promise.resolve("test");
  }
};

exports["test scraper should run"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.run().then(function() {
    assert.pass();
    scraper._tab.close();
    done();
  });
};

exports["test scraper should run with a given tab"] = function(assert, done) {

  tabs.open({
    url: "about:blank",
    onOpen: function(tab) {
      
      const scraper = Scraper({
        url: self.data.url("./test-1.html"),
        captchaSolver: captchaSolver,
        tab: tab
      });

      scraper.run().then(function() {
        assert.pass();
        tab.close();
        done();
      });
    }
  });
};


exports["test scraper should find text"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.getText("#text-1").then(function() {
    scraper.getText("#text-2").then(function() {
      scraper.getText("#text-3");
    });

    scraper.getText("#text-4");
  });

  scraper.getText("#text-5").then(function() {
    scraper.getText("#text-6");
  });


  scraper.run().then(function(result) {
    assert.equal(result[0], "text 1");
    assert.equal(result[1], "text 2");
    assert.equal(result[2], "text 3");
    assert.equal(result[3], "text 4");
    assert.equal(result[4], "text 5");
    assert.equal(result[5], "text 6");
    scraper._tab.close();
    done();
  });
};


exports["test scraper should fail getting text"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.getText("#nothing");

  scraper.run().catch(function(error) {
      assert.ok(error);
      done();
      scraper._tab.close();
    });
};

exports["test scraper should get attribute"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.getAttribute("a", "href").then(function(value) {
    assert.equal(value, "test-2.html");
  });
  
  scraper.run().then(function() {
    done();
    scraper._tab.close();
  });
};


exports["test scraper the reject callback should be called"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.getAttribute("body", "href").then(function() {
    assert.fail();
  }, function() {
    assert.ok(true);
  });

  scraper.run().then(function() {
    scraper._tab.close();
    done();
  });
};

exports["test scraper should follow link "] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.clickOn("a");

  scraper.waitForLoading();

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};



exports["test scraper should follow link "] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.clickOn("a");
  scraper.waitForLoading();
  scraper.getText("#page");

  scraper.run().then(function() {
    assert.equal(scraper.url, self.data.url("./test-2.html"));
    scraper._tab.close();
    done();
  });
};

exports["test scraper should fail clicking"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.clickOn("#nothing");

  scraper.run()
    .catch(function(error) {
      assert.ok(error);
      done();
      scraper._tab.close();
    });
};


exports["test scraper should wait for element"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.waitForElement("#dynamic", 1000);

  scraper.run()
    .then(function() {
      assert.ok(true);
      scraper._tab.close();
      done();
    });
};

exports["test scraper should timeout waiting for element"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.waitForElement("#nothing", 1000);

  scraper.run()
    .catch(function(error) {
      assert.ok(error);
      scraper._tab.close();
      done();
    });
};


exports["test scraper should fill in a value"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.fillIn("input[type=text]", "password");

  scraper.getValue("input[type=text]").then(function(value) {
    assert.equal("password", value);
  });

  scraper.run().then(function() {
    scraper._tab.close();
    done();
  });
};


exports["test scraper should fail filling in a value"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.fillIn("input[type=password]", "password");

  scraper.getValue("input[type=password]").then(function() {
    assert.fail();
  });

  scraper.run().catch(function(error) {
    assert.ok(error);
    scraper._tab.close();    
    done();
  });
};


exports["test scraper should solve a captcha"] = function(assert, done) {

  const captchaSolver = {
    solveCaptcha: function() {
      return new Promise(function(resolve) {
        resolve("secret");
      });
    }
  };

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.solveCaptcha("img", "input[type=text]").then(function(solution) {
    assert.equal("secret", solution);

    scraper.getValue("input[type=text]").then(function(value) {
      assert.equal("secret", value);
    });
  });

  scraper.run().then(function() {
    scraper._tab.close();
    done();
  });
};

exports["test scraper should get text and then follow a link"] = function(assert, done) {

  const scraper = Scraper({
    url: self.data.url("./test-1.html"),
    captchaSolver: captchaSolver
  });

  scraper.getText("#page").then(function(text){
    assert.equal("1", text);

    scraper.clickOn("a");
    scraper.waitForLoading();

    scraper.getText("#page").then(function(text) {
      assert.equal("2", text);
    });
  });

  scraper.run().then(function() {
    scraper._tab.close();
    done();
  });
};


require("sdk/test").run(exports);

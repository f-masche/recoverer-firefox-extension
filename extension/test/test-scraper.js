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

    done();
  });
};


exports["test scraper should fail getting text"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.getText("#nothing");

  scraper.run().catch(function(error) {
      assert.ok(error);
      done();
    });
};

exports["test scraper should get attribute"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.getAttribute("a", "href").then(function(value) {
    assert.equal(value, "test-2.html");
    done();
  });
  
  scraper.run();
};


exports["test scraper the reject callback should be called"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.getAttribute("body", "href").then(function() {
    assert.fail();
  }, function() {
    assert.ok(true);
    done();
  });

  scraper.run();
};

exports["test scraper should follow link "] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.clickOn("a");

  scraper.waitForLoading();

  scraper.getText("#page").then(function(text) {
    assert.equal(text, "2");
    done();
  });

  scraper.run();
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

  scraper.waitForElement("#dynamic", 1000);

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


exports["test scraper should fill in a value"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.fillIn("input[type=text]", "password");

  scraper.getAttribute("input[type=text]", "value").then(function(value) {
    assert.equal("password", value);
    done();
  });

  scraper.run();
};


exports["test scraper should fail filling in a value"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.fillIn("input[type=password]", "password");

  scraper.getAttribute("input[type=password]", "value").then(function() {
    assert.fail();
  });

  scraper.run().catch(function(error) {
    assert.ok(error);
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

  const scraper = Scraper(self.data.url("./test-1.html"), captchaSolver);

  scraper.solveCaptcha("img", "input[type=text]").then(function(solution) {
    assert.equal("secret", solution);

    scraper.getAttribute("input[type=text]", "value").then(function(value) {
      assert.equal("secret", value);
      done();
    });
  });

  scraper.run();
};

exports["test scraper should get text and then follow a link"] = function(assert, done) {
  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.getText("#page").then(function(text){
    assert.equal("1", text);

    scraper.clickOn("a");
    scraper.waitForLoading();

    scraper.getText("#page").then(function(text) {
      assert.equal("2", text);
      done();
    });
  });

  scraper.run();
};

exports["test scraper should save the current url"] = function(assert, done) {

  const scraper = Scraper(self.data.url("./test-1.html"));

  scraper.clickOn("a");
  scraper.waitForLoading();

  scraper.run()
    .then(function() {
      assert.equal(scraper.url, self.data.url("test-2.html"));
      done();
    });
};

require("sdk/test").run(exports);

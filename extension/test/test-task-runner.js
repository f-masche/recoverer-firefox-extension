const { TaskRunner } = require("task-runner");
const { Task } = require("tasks/task");


exports["test task runner should call all methods of the tasks"] = function(assert, done) {

  const userEmail = "test@test.com";
  const mockFilters = { from: userEmail };
  var calledLogin = false;
  var calledResetPassword  = false;
  var calledSetNewPassword = false;

  const task = Task({
    name: "mock",
    loginUrlPattern: /.*/,
    loginUrl: "about:blank",
    resetLinkPattern: /about:blank/,
    emailFilters: mockFilters,
    login: function(scraper, email, password) {
      calledLogin = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.equal(email, userEmail,  "Email is correct");
      assert.ok(typeof password === "string" && password.length === 14, "Password exists");
    },
    resetPassword: function(scraper, email) {
      calledResetPassword = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.equal(email, userEmail,  "Email is correct");
    },
    setNewPassword: function(scraper, password) {
      calledSetNewPassword = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.ok(typeof password === "string" && password.length === 14, "Password exists");
    }
  });


  const emailSource = {
    waitForEmail: function(filters) {
      assert.equal(filters.from, mockFilters.from, "Add email filter from task");
      assert.equal(filters.in, "inbox", "Search in inbox");
      assert.equal(filters.is, "unread", "Search for unread email");

      return Promise.resolve({ text: "about:blank", original: { id: "123"} });
    },
    setEmailAsRead: function() {
      return Promise.resolve();
    }   
  };

  const taskRunner = TaskRunner({
    userEmail: userEmail,
    task: task,
    loginTab: {
      url: null
    },
    captchaSolver: {},
    emailSource: emailSource
  });

  taskRunner.run();

  taskRunner.on("statusUpdate", function(status, message) {
    if(status === "loggedIn") {
      assert.ok(calledLogin, "Called login");
      assert.ok(calledResetPassword, "Called resetPassword");
      assert.ok(calledSetNewPassword, "Called setNewPassword");
      taskRunner._scraper._tab.close();//only needed in test
      done();     
    } if(status === "error") {
      assert.fail(message);
    }
  }, function(error){
    assert.fail(error);
  });
};


require("sdk/test").run(exports);

const { TaskRunner } = require("task-runner");
const { Task } = require("tasks/task");

const mockEmail = "test@test.com";

exports["test task runner should call all methods of the tasks"] = function(assert, done) {

  var calledLogin = false;
  var calledResetPassword  = false;
  var calledSetNewPassword = false;

  const task = Task({
    name: "mock",
    loginUrlPattern: /.*/,
    loginUrl: "loginurl",
    resetLinkPattern: /https:\/\/resetlink/,
    messageFilters: {},
    login: function(scraper, email, password) {
      calledLogin = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.equal(email, mockEmail,  "Email is correct");
      assert.ok(typeof password === "string" && password.length === 14, "Password exists");
    },
    resetPassword: function(scraper, email) {
      calledResetPassword = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.equal(email, mockEmail,  "Email is correct");
    },
    setNewPassword: function(scraper, password) {
      calledSetNewPassword = true;
      assert.ok(scraper.clickOn, "Scraper exists");
      assert.ok(typeof password === "string" && password.length === 14, "Password exists");
    }
  });


  const emailSource = {
      waitForMessage: function() {
        return Promise.resolve({ text: "https://resetlink" });
      },
      setMessageAsRead: function() {
        return Promise.resolve();
      }   
    };

  const taskRunner = TaskRunner({
    email: mockEmail,
    task: task,
    loginTab: {
      url: null
    },
    captchaSolver: {},
    emailSource: emailSource
  });

  taskRunner.run();

  taskRunner.on("statusUpdate", function(status) {
    console.log(status);
    if(status === "loggedIn") {
      assert.ok(calledLogin, "Called login");
      assert.ok(calledResetPassword, "Called resetPassword");
      assert.ok(calledSetNewPassword, "Called setNewPassword");

      done();     
    }

  });
};


require("sdk/test").run(exports);

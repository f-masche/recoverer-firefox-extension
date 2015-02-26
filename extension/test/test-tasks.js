const tasks = require("tasks");
const { Task } = require("tasks/task");


exports["test tasks should return a list of tasknames"] = function(assert) {
  const taskNames = tasks.getTaskNames();

  assert.ok(taskNames.length > 0, "task names not empty");
};

exports["test tasks should return a task from a name"] = function(assert) {
  const taskNames = tasks.getTaskNames();
  const task = tasks.getTaskForName(taskNames[0]);

  assert.ok(task instanceof Task, "returned a valid task");
};

require("sdk/test").run(exports);

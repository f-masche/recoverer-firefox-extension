const { TaskRunner } = require("task-runner");
const { githubTask } = require("github-task");

// exports["test runner should call messagePolling"] = function(assert) {
//   const taskRunner = TaskRunner({
//     task: githubTask,
//     loginTab: 
//   });

//   taskRunner.messagePolling = {
//     waitForMessage: function(filters) {
//       assert.ok(filters.from === githubTask.messageFilters.from);
//       assert.ok(filters.subject === githubTask.messageFilters.subject);
//       assert.ok(filters.in === "inbox");
//     }
//   };

//   taskRunner._getMessage();
// };

require("sdk/test").run(exports);

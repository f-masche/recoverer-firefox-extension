const { GmailClient } = require("email/gmail-client");
const base64 = require("sdk/base64");

exports["test gmail client should authenticate before sending a request"] = function(assert, done) {

  const gmailClient = GmailClient("name@gmail.com");
  var calledAuthenicate = false;

  //mock authentication
  gmailClient._authenticate = function () {
    calledAuthenicate = true;
    return Promise.resolve();
  };

  const request = gmailClient._send({url: "https://mozilla.org"});

  request.then(function() {
    assert.ok(calledAuthenicate, "Authenticated");
    done();
  });
};

exports["test gmail client should list the messages"] = function(assert, done) {

  const gmailClient = GmailClient("name@gmail.com");

  const mockMessages = ["message1", "message2"];

  //mock send method
  gmailClient._send = function (options) {
    assert.equal(options.url, "https://www.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread");
    return Promise.resolve(mockMessages);
  };

  const request = gmailClient.listMessages({in: "inbox", is: "unread"});

  request.then(function(messages) {
    assert.equal(mockMessages, messages, "Fetched messages");
    done();
  });
};


exports["test gmail client should get and parse a message"] = function(assert, done) {

  const gmailClient = GmailClient("name@gmail.com");

  const mockMessage = {
    payload: {
      mimeType: "text/plain",
      body: {
        size: 128,
        data: base64.encode("dummy")
      },
      parts: [
        {
          mimeType: "text/html",
          body: {
            size: 128,
            data: base64.encode("Message")
          }
        }
      ]
    }
  };

  //mock send method
  gmailClient._send = function (options) {
    assert.equal(options.url, "https://www.googleapis.com/gmail/v1/users/me/messages/message-id");
    return Promise.resolve(mockMessage);
  };

  const request = gmailClient.getMessage("message-id");

  request.then(function(result) {
    assert.equal(result.original, mockMessage, "Returned the original message");
    assert.equal(result.text, "dummyMessage", "Returned the parsed text");

    done();
  });
};


exports["test gmail client should modify a message"] = function(assert, done) {

  const gmailClient = GmailClient("name@gmail.com");

  const toRemove = ["UNREAD"];
  const toAdd = ["READ"];

  const mockContent = {
    removeLabelIds: toRemove,
    addLabelIds: toAdd
  };

  //mock send method
  gmailClient._send = function (options) {
    assert.equal(options.method, "post", "Sended a post");
    assert.equal(options.url, "https://www.googleapis.com/gmail/v1/users/me/messages/message-id/modify");
    assert.equal(options.contentType, "application/json", "Sended a json");
    assert.equal(options.content, JSON.stringify(mockContent), "Sends the content");
    return Promise.resolve();
  };

  const request = gmailClient.modifyMessage("message-id", toAdd, toRemove);

  request.then(function() {
    done();
  });
};

require("sdk/test").run(exports);

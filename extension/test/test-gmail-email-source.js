const { GmailEmailSource } = require("email/gmail-email-source");


exports["test gmail email source should wait for email"] = function(assert, done) {

  const emailSource = GmailEmailSource("name@gmail.com");

  const emailFilters = {is: "unread"};
  const mockEmail = {text: "mock"};

  var counter = 0;

  emailSource._gmailClient = {
    listMessages: function() {
      counter++;
      console.log(arguments);
      if(counter >= 3) {
        return Promise.resolve({
          messages: [{id: "123"}]
        });
      } else {
        return Promise.resolve({});
      }
    },
    getMessage: function(id) {
      if(id === "123") {
        return Promise.resolve(mockEmail);
      }

      assert.fail("Expected the email id");
    }
  };

  emailSource.waitForEmail(emailFilters).then(function(email) {
    assert.equal(email, mockEmail);
    done();
  });
};


exports["test gmail email source should set email as read"] = function(assert, done) {

  const emailSource = GmailEmailSource("name@gmail.com");

  var calledModifyMessage = false;

  emailSource._gmailClient = {
    modifyMessage: function(messageId,  labelsToAdd, labelsToRemove) {
      assert.equal(messageId, "mock-id", "Modify correct email");
      assert.equal(labelsToAdd, null, "mock-id", "No labels to add");
      assert.ok(arrayDeepEquals(labelsToRemove, ["UNREAD"]), "Removed unread label");
      calledModifyMessage = true;
      return Promise.resolve();
    }
  };

  emailSource.setEmailAsRead("mock-id").then(function() {
    assert.ok(calledModifyMessage, "Called modify message");
    done();
  });
};


function arrayDeepEquals(array, other) {
  var result = true;

  if(array && other && array.length === other.length) {

    for(let i = 0; i < array.length; i++) {
      if(array[i] !== other[i]) {
        result = false;
      }
    }
  } else {
    result = false;
  }
  return result;
}

require("sdk/test").run(exports);
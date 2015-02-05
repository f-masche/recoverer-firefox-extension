const { setTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");
const { GmailClient } = require("email/gmail-client");

const MAX_TRIES = 15;

const POLLING_INTERVAL = 2000;


const GmailEmailSource = Class({
  initialize: function(userId) {
    if(typeof userId !== "string") {
      throw new Error("Expected userId to be a String");
    }

    this._gmailClient = GmailClient(userId);
  },

  waitForEmail: function(filter) {      
    const self = this;
    var times = 0;

    const fetchEmail = function(resolve, reject) {

      self._gmailClient
        .listMessages(filter)
        .then(function( result ) {
          const messages = result.messages;
          const message = messages && messages.length && messages[0];

          if(message) {
            resolve(message);
          } else if (times >= MAX_TRIES) {
            reject("No email found");
          } else {
            times += 1;
            setTimeout(() => fetchEmail(resolve, reject), POLLING_INTERVAL);
          }
        });
    };

    return new Promise(fetchEmail).then(function(email) {
        return self._gmailClient.getMessage(email.id);
      });
  },

  setEmailAsRead: function(id) {
    return this._gmailClient.modifyMessage(id, null, ["UNREAD"]);
  }
}); 



exports.GmailEmailSource = GmailEmailSource;

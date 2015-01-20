const { setTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");
const { GmailClient } = require("gmail-client");

const MAX_TRIES = 30;

const POLLING_INTERVAL = 2000;


// function findCorrectMessage(messagesList, startDate) {
//   let result = null;

//   if(messagesList.messages) {

//     for(let i = 0; i < messagesList.messages.length; i++) {
//       const message = messagesList.messages[0];
//       const dateHeader = message.original.payload.headers
//         .find((h) => h.name === "Date");

//       const messageDate = new Date(dateHeader.value);
//       if(messageDate > startDate) {
//         result = message;
//         break;
//       }
//     }
//   }

//   return result;
// }


function pollMessages(GmailClient, filter) {
  let times = 0;

  const fetchMessages = function(resolve, reject) {

    GmailClient
      .listMessages(filter)
      .then(function({ messages }) {
        const message = messages && messages.length && messages[0];

        if(message) {
          resolve(message);
        } else if (times >= MAX_TRIES) {
          reject("No email found");
        } else {
          times += 1;
          setTimeout(() => fetchMessages(resolve, reject), POLLING_INTERVAL);
        }
      });
  };

  return new Promise(fetchMessages);
}


const GmailMessageSource = Class({
  initialize: function(userId) {
    this.GmailClient = GmailClient(userId);
  },

  waitForMessage: function(filter) {
    const self = this;

    return pollMessages(this.GmailClient, filter)
      .then(function(message) {
          return self.GmailClient.getMessage(message.id);
      });
  },

  setMessageAsRead: function(userId, message) {
    return this.GmailClient.modifyMessage(message.original.id, null, ["UNREAD"]);
  }
}); 



exports.GmailMessageSource = GmailMessageSource;
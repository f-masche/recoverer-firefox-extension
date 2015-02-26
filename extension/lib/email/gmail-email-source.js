/**
* This module provides a more generic wrapper for the gmail client.
* Allows to wait for a specific email and mark it as read.
*/ 

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


  /*
  * Waits a certain time for an email.
  * 
  * @param {Object} filters
  *   Filters to find the email.
  *   Equivalent to the GMail-API filters.
  *
  * @return {Promise}
  *   A promise that gets resolved with the email.
  *   Gets rejected if timed out.
  */
  waitForEmail: function(filters) {      
    const self = this;
    var times = 0;

    const fetchEmail = function(resolve, reject) {

      self._gmailClient
        .listMessages(filters)
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


  /**
  * Marks an email as read.
  *   @param {String} id
  *     Id of the email
  */
  setEmailAsRead: function(id) {
    return this._gmailClient.modifyMessage(id, null, ["UNREAD"]);
  }
}); 



exports.GmailEmailSource = GmailEmailSource;

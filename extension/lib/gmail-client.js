const Http = require("http");
const { Cr, Ci } = require("chrome");
const { Class } = require("sdk/core/heritage");
const windows = require("sdk/windows").browserWindows;
const events = require("sdk/system/events");
const base64 = require("sdk/base64");

/**
* The url of the google OAuth2 login dialog.
*/
const OAUTH_URL = "https://accounts.google.com/o/oauth2/auth";

/**
* The client id of this application
*/
const CLIENT_ID = "161657375993-g2mk0thgpndek0jvqlm84gf0ie38qpbc.apps.googleusercontent.com";

/**
* The scope of this application needs.
* Read/Write access to messages, e.g. to be able to set the message status to unread
*/
const SCOPE = "https://www.googleapis.com/auth/gmail.modify";

/**
* This is the local OAuth2 redirect uri.
* This uri will get  blocked from loading, so no one listening on the port can get the token.
*/
const REDIRECT_URI = "http://localhost:10023";

/**
* Host of the gmail api.
*/
const GMAIL_HOST = "https://www.googleapis.com/gmail/v1";

/**
* Host of the OAuth2 api.
*/
const OAUTH_HOST = "https://www.googleapis.com/oauth2/v1";




/**
* Fetches the OAuth2 token.
* Opens the google login dialog in a new window.
*
* @param {String} userId
*   The users email address.
* @return {Promise} 
*   A Promise that gets resolved with the OAuth2 token.
*/
function getToken(userId) {
  console.log("fetching token");

  return new Promise(function(resolve, reject) {
    const oauthWindow = openAuthWindow(userId);
    const redirectUrlPattern = new RegExp("^" + REDIRECT_URI);

    const redirectUrlListener = function(event) {
      //subject.QueryInterface(Ci.nsIHttpChannel);

      const subject = event.subject.QueryInterface(Ci.nsIHttpChannel);
      const url = subject.URI.spec;

      console.log("observed", url);
      if (redirectUrlPattern.test(url)) {
        subject.cancel(Cr.NS_BINDING_ABORTED);
        var token = getTokenFromUrl(url);

        if(token) {
          resolve(token);
        } else {
          reject("No OAuth2 token found in redirect url");
        }
        oauthWindow.close();
        events.off("http-on-modify-request", redirectUrlListener);
      }
    };

    events.on("http-on-modify-request", redirectUrlListener);

    oauthWindow.once("close",function() {
      reject("Login window was closed too early");
      events.off("http-on-modify-request", redirectUrlListener);
    });
  });
}


/**
* Extracts the access token from the redirect url.
*
* @param {String} url 
*   The url with the token.
* @return {String} 
*   The extracted token.
*   Returns an empty String if no token was found.
*/
function getTokenFromUrl(url) {
  var token = "";
  var matches = url.match(/^.*?#access_token=(.*?)&.*$/);

  if(matches && matches.length === 2) {
    token = matches[1];
  }

  return token;
}

/**
* Validates a token against the api.
* @param {String} token An authorization token.
* @return {Promise} 
*   A promise that gets resolved with the token, if the token is valid.
*/
function validateToken(token) {

  const request = Http.send({
    url: OAUTH_HOST + "/tokeninfo?access_token=" + token,
    format: "json"
  });

  return request.then(function(response) {
    if(response.audience === CLIENT_ID) {
      console.log("validated token");
      return token;
    } else {
      console.log("invalid token");
      return Promise.reject("Invalid OAuth2 token");
    }
  });
}


/**
* Opens a new browser window with the google OAuth2 dialog.
* @return {Window} 
*   The new window object.
*/
function openAuthWindow(userId) {
  var url = OAUTH_URL +
  "?response_type=token" +
  "&client_id=" + CLIENT_ID +
  "&redirect_uri=" + REDIRECT_URI +
  "&scope=" + SCOPE +
  "&login_hint=" + userId;

  console.log("gmail-api: opening new window at " + url);
  return windows.open({url: url});
}


/**
* Parses the base64 body of a message to a string.
* @return {String}
*   The text content of the message.
*   Can be plain text or/and html.
*/
function parseMessageBody(message) {
  let text = "";

  console.log(JSON.stringify(message));
  function parsePart(part) {
    if((part.mimeType === "text/plain" || part.mimeType === "text/html") && part.body.size) {
      try {
        const base64String = part.body.data.replace(/[-_]/g, "+");
        text += base64.decode(base64String, "utf-8");
      } catch (e) {
        console.error("gmail-api: error decoding base64 string");
      }
    }

    if(part.parts) {
      for(let subPart of part.parts) {
        parsePart(subPart);
      } 
    }
  }

  parsePart(message.payload);

  console.log(text);

  return text;
}


/**
* This class is a simple client to access the gmail api.
* The authentication is implemented via OAuth2.
*/
const GmailClient = Class({

  initialize: function(userId) {
    this.userId = userId;
    this.oauthToken = "";
  },

  listMessages: function(filters) {
    let url = GMAIL_HOST + "/users/me/messages?q=";

    if(filters) {
      for(let name in filters) {
        url += name + ":" + filters[name] + " ";
      }  
    }

    return this._send({ 
      url: url ,
      format: "json"
    });
  },

  getMessage: function(messageId) {
    const request = this._send({
        url: GMAIL_HOST + "/users/me/messages/" + messageId,
        format: "json"
      });

    return request.then(function(message) {
      return {
        original: message,
        text: parseMessageBody(message)
      };
    });
  },

  modifyMessage: function(messageId, labelsToAdd, labelsToRemove) {
    console.log("gmail-api: modify message " + messageId);

    return this._send({
      method: "post",
      url: GMAIL_HOST + "/users/me/messages/" + messageId + "/modify",
      data: {
        removeLabelIds: labelsToRemove || [],
        addLabelIds: labelsToAdd || [] 
      }    
    });
  },

  _send: function(options) {
    const self = this;

    return this._authenticate()
      .then(function() {

        if(!options.headers) {
          options.headers = {};
        }

        options.headers.Authorization = "Bearer " + self.oauthToken;

        console.log("gmail-client: sending request " + JSON.stringify(options));

        return Http.send(options);
      });
  },

  _authenticate: function() {
    if(this.oauthToken) {
      return Promise.resolve(this.oauthToken);
    } else {
      const self = this;

      return getToken(this.userId)
        .then(validateToken)
        .then(function(token) {
          self.oauthToken = token;
        });
    }
  }
});


exports.GmailClient = GmailClient;
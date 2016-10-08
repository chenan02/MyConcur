'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const fetch = require('node-fetch')

let Wit = null;
let log = null;
try {
  Wit = require('../').interctive;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}
const WIT_TOKEN = "ELKAFRRNUCA2II6FZAC65L3Q5NMYN6RJ"
const FB_APP_SECRET = "82334ed66b5e2d0e65b6de9a6ca4ff6a"

app.set('port', (process.env.PORT || 5000))

app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})




app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:FB_PAGE_TOKEN},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// ------- wit.ai bot stuff --------- //
const sessions = {}
const findOrCreateSession = (fbid) => {
  let sessionId;
  Object.keys(sessions).forEach(k => {
    if(sessions[k].fbid === fbid) {
      sessionId = k;
    }
  });
  if(!sessionId) {
    sessionId = new Date().toISOSring();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// -- bot actions -- //
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
};

// setting up bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});



const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

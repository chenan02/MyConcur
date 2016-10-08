'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var config = require('./config')
var FB = require('./fb_connector')
var Bot = require('./bot')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.use(bodyParser.json())

/*app.use((method, url, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});*/

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
  console.log(req)
    if (req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})


// to send messages to facebook
app.post('/webhook/', function (req, res) {
  var entry = FB.getMessageEntry(req.body)
  // IS THE ENTRY A VALID MESSAGE?
  if (entry && entry.message) {
    if (entry.message.attachments) {
      // NOT SMART ENOUGH FOR ATTACHMENTS YET
      FB.newMessage(entry.sender.id, "That's interesting!")
    } else {
      FB.newMessage(entry.sender.id, "That's interesting!")
      // SEND TO BOT FOR PROCESSING
        //Bot.read(entry.sender.id, entry.message.text, function (sender, reply) {
        //FB.newMessage(sender, reply)
      //})
    }
  }

  res.status(200).end();

})

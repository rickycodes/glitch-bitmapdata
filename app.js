var nconf = require('nconf')
var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var app = express()

var exec = require('child_process').exec
var Canvas = require('canvas')
var Image = Canvas.Image
var fs = require('fs')

var sprite = fs.readFileSync('sprites/megaman.png')

nconf.argv().env().file({
  file: 'local.json'
})

app.use(bodyParser.json({
  limit: '2mb'
}))

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

function megamanize(buffer) {
  var img = new Image
  img.src = buffer

  var width = 320
  var height = 240
  
  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')
  var sprite_img = new Image
  sprite_img.src = sprite

  // draw the original image
  ctx.drawImage(img, 0, 0, width, height)
  
  // we'll do two passes
  for( var j = 0; j < 2; j++ ) {
    var sprite_x = 0;
    // add five megamans, looping horizontally over the sprite sheet
    for( i = 0; i < 5; i++ ) {
      // upscale the sprite
      var upscale = Math.floor(Math.random()*2)+1
      var sprite_width = 42 * upscale
      var sprite_height = 48 * upscale
      
      // randomize the alpha
      ctx.globalAlpha = Math.random()*1

      // draw it
      ctx.drawImage(
        sprite_img,
        sprite_x,
        0,
        42,
        48,
        Math.floor(Math.random()*(width-sprite_width)),
        Math.floor(Math.random()*(height-sprite_height)),
        sprite_width,
        sprite_height
      )
      sprite_x += 42
    }
  }

  var buffer = canvas.toDataURL()
  return buffer
}

app.post('/service', function(req, res) {
  var buffer = dataUriToBuffer(req.body.content.data)
  var mega = megamanize(buffer)

  req.body.content.data = mega;
  req.body.content.type = buffer.type
  res.json(req.body)
})

var port = nconf.get('port')
app.listen(port)
console.log('server running on port: ', port)
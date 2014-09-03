var nconf = require('nconf')
var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var app = express()

var exec = require('child_process').exec
var Canvas = require('canvas')
var GifEncoder = require('gif-encoder')
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

}

app.post('/service', function(req, res) {

  var buffer = dataUriToBuffer(req.body.content.data)

  var img = new Image
  img.src = buffer

  var ratio = img.width / img.height
  var width = 420
  var height = width / ratio
  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')
  var sprite_img = new Image
  sprite_img.src = sprite

  var gif = new GifEncoder(width, height, { 'highWaterMark' : 1048576 });

  gif.setDelay(120)
  gif.setRepeat(0)

  gif.writeHeader()

  var sprite_x = 0

  // upscale the sprite
  var upscale = 1
  var sprite_width = 95 * upscale
  var sprite_height = 95 * upscale

  var xPos = Math.floor(Math.random() * (width - sprite_width))
  var yPos = Math.floor(Math.random() * (height - sprite_height))

  // loop horizontally over the sprite sheet
  for (i = 0; i < 4; i++) {

    // draw the original image
    ctx.drawImage(img, 0, 0, width, height)

    // randomize the alpha
    // ctx.globalAlpha = Math.random() * 1

    // draw it
    ctx.drawImage(
      sprite_img,
      sprite_x,
      0,
      95,
      95,
      // randomize placement (x,y)
      xPos,
      yPos,
      sprite_width,
      sprite_height
    )
    sprite_x += 95
    gif.addFrame(ctx.getImageData(0,0,width,height).data)
  }

  gif.finish()

  gif.on('readable', function() {

    var buffer = gif.read()
    var dataUri = 'data:image/gif;base64,' + buffer.toString('base64')
    
    req.body.content.data = dataUri
    req.body.content.type = 'image/gif'
    res.json(req.body)
  })
})

var port = nconf.get('port')
app.listen(port)
console.log('server running on port: ', port)
var nconf = require('nconf')
var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var app = express()

var bitmapData = require('./BitmapData.js')

var Point = bitmapData.Point
var Rectangle = bitmapData.Rectangle
var ColorMatrixFilter = bitmapData.ColorMatrixFilter

var exec = require('child_process').exec
var Canvas = require('canvas')
var GifEncoder = require('gif-encoder')
var Image = Canvas.Image

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

function getIMG(buffer) {
  var img = new Image
  img.src = buffer
  return img
}

function colorize(buffer) {
  
  var img = getIMG(buffer)

  var width = img.width
  var height = img.height

  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')

  var hwm = 128 * 100 * 1024 // brycebaril told me to
  var gif = new GifEncoder(width, height, {
    'highWaterMark': hwm
  })

  gif.setDelay(100)
  gif.setRepeat(0)

  gif.writeHeader()

  // draw the original image
  ctx.drawImage(img, 0, 0, width, height)

  var bmd = new bitmapData.BitmapData(width, height)

  var zeroPoint = new Point()

  for(var i =0; i < 4; i++) {
    var matrix = [
        2*i+1, 0, 0, 0, 0,
        0, 2*i+1, 0, 0, 0,
        0, 0, 2*i+1, 0, 0,
        0, 0, 0, 1, 0
      ]

    var filter = new ColorMatrixFilter(matrix)
    
    bmd.draw(img)
    bmd.applyFilter(bmd, bmd.rect, zeroPoint, filter)
    
    ctx.putImageData(bmd.data, 0, 0, 0, 0, width, height)

    gif.addFrame(ctx.getImageData(0, 0, width, height).data)
  }

  gif.finish()

  return gif
}

function LSD(buffer) {

  var img = getIMG(buffer)

  var width = img.width
  var height = img.height

  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')

  var hwm = 128 * 100 * 1024 // brycebaril told me to
  var gif = new GifEncoder(width, height, {
    'highWaterMark': hwm
  })

  gif.setDelay(120)
  gif.setRepeat(0)

  gif.writeHeader()

  // draw the original image
  ctx.drawImage(img, 0, 0, width, height)

  var bmd = new bitmapData.BitmapData(width, height)

  bmd.draw(img)

  var colorModifier = 1
  var rArray = [],
    gArray = [],
    bArray = []
  var point = new Point(0, 0)

  ctx.drawImage(img, 0, 0, width, height)
  gif.addFrame(ctx.getImageData(0, 0, width, height).data)

  var howMany = 2 // two frames, plus above

  for (var j = 0; j < howMany; j++) {

    for (var i = 0; i < 256; i++) {
      r = i + colorModifier
      if (r > 255) r = r - 256

      g = i + colorModifier + r
      if (g > 255) g = g - 256

      b = i + colorModifier + g
      if (b > 255) b = b - 256

      rArray[i] = r
      gArray[i] = g
      bArray[i] = b
    }

    bmd.paletteMap(bmd,
      bmd.rect,
      point,
      rArray,
      gArray,
      bArray)

    colorModifier += 1
    if (colorModifier > 254) colorModifier = 0

    ctx.putImageData(bmd.data, 0, 0)
    gif.addFrame(ctx.getImageData(0, 0, width, height).data)
  }

  gif.finish()

  return gif
}

app.post('/service', function(req, res) {
  var imgBuff = dataUriToBuffer(req.body.content.data)

  var effects = [ colorize, LSD ]
  var randomEffect = effects[Math.floor(Math.random()*effects.length)]

  var gif = (randomEffect)(imgBuff)

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
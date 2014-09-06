var nconf = require('nconf')
var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var app = express()

var bmd = require('./BitmapData.js')

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

function plurnt(buffer) {

  var img = new Image
  img.src = buffer

  var ratio = img.width / img.height
  var width = 420
  var height = width / ratio
  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')

  // draw the original image
  ctx.drawImage(img, 0, 0, width, height)

  var bitmapData = new bmd.BitmapData(canvas.width, canvas.height)

  bitmapData.draw(img)

  console.log(bitmapData.drawingCanvas)

  var buffer = canvas.toDataURL()
  
  return buffer

  // will likely return gif later
}

app.post('/service', function(req, res) {
  var imgBuff = dataUriToBuffer(req.body.content.data)
  var turnt = plurnt(imgBuff);
  req.body.content.data = turnt;
  req.body.content.type = imgBuff.type
  res.json(req.body)
})

var port = nconf.get('port')
app.listen(port)
console.log('server running on port: ', port)
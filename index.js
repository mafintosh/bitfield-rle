var varint = require('varint')

exports.encodingLength = encodingLength
exports.encode = encode
exports.decode = decode

encode.bytes = decode.bytes = 0

function rle (bytes, state) {
  var prev = 2
  var len = 0

  for (var i = 0; i < bytes.length; i++) {
    var byte = bytes[i]
    for (var j = 0; j < 8; j++) {
      var bit = (byte & (128 >> j)) ? 1 : 0
      if (bit === prev) {
        len++
      } else {
        if (len) write(prev, i * 8 + j - len, len, state)
        len = 1
        prev = bit
      }
    }
  }

  if (len) write(prev, bytes.length * 8 - len, len, state)
  while (state.offset & 7) {
    if (state.bitfield) set(state.bitfield, state.offset++, bit)
    else state.offset++
  }

  return varint.encodingLength(state.deltas.length / 2) + state.deltasBytes + state.offset / 8
}

function encodingLength (bytes) {
  return rle(bytes, new CompressionState(0))
}

function encode (bytes, buf, offset) {
  var state = new CompressionState(bytes.length)
  var bufLength = rle(bytes, state)
  if (!buf) buf = Buffer(bufLength)
  if (!offset) offset = 0

  varint.encode(state.deltas.length / 2, buf, offset)
  offset += varint.encode.bytes

  for (var h = 0; h < state.deltas.length; h++) {
    varint.encode(state.deltas[h], buf, offset)
    offset += varint.encode.bytes
  }

  encode.bytes = bufLength
  if (state.bitfield) state.bitfield.copy(buf, offset)

  return buf.slice(0, bufLength)
}

function write (bit, start, length, state) {
  var delta = start - state.deltasAcc
  var cost = varint.encodingLength(delta) + varint.encodingLength(length)

  if (8 * cost + 1 < length) {
    state.deltasBytes += cost
    state.deltasAcc += delta + length
    if (state.deltas) state.deltas.push(delta, length)
    if (state.bitfield) set(state.bitfield, state.offset++, bit)
    else state.offset++
  } else {
    for (var i = 0; i < length; i++) {
      if (state.bitfield) set(state.bitfield, state.offset++, bit)
      else state.offset++
    }
  }
}

function decode (buf, offset) {
  if (!offset) offset = 0

  var resultLength = 0
  var delta = 2 * varint.decode(buf, offset)
  offset += varint.decode.bytes

  if (delta > 2 * buf.length || !(delta >= 0)) throw new Error('Invalid delta count')
  var deltas = new Array(delta)

  for (var i = 0; i < deltas.length; i++) {
    deltas[i] = varint.decode(buf, offset)
    offset += varint.decode.bytes
    resultLength += deltas[i]
  }

  resultLength += 8 * (buf.length - offset)
  if (resultLength & 7) resultLength = resultLength - (resultLength & 7) + 8

  var result = Buffer(resultLength / 8)
  var bitfieldOffset = offset * 8
  var bitfieldEnd = buf.length * 8
  var acc = 0

  offset = 0
  delta = 0

  while (bitfieldOffset < bitfieldEnd) {
    var next = delta < deltas.length ? acc + deltas[delta++] : -1

    while (bitfieldOffset < bitfieldEnd && (next === -1 || offset < next)) {
      set(result, offset++, get(buf, bitfieldOffset++))
    }
    if (next > -1) {
      var bit = get(buf, bitfieldOffset++)
      var len = deltas[delta++]
      acc = next + len
      for (var j = 0; j < len; j++) set(result, offset++, bit)
    }
  }

  if (delta < deltas.length) throw new Error('Missing deltas')

  while (offset & 7) offset--

  decode.bytes = offset / 8
  return result.slice(0, decode.bytes)
}

function get (bitfield, index) { // These two bitfield methods could be their own module
  var byte = index >> 3
  var bit = index & 7
  return (bitfield[byte] & (128 >> bit)) ? 1 : 0
}

function set (bitfield, index, val) {
  var byte = index >> 3
  var bit = index & 7
  var mask = 128 >> bit
  var b = bitfield[byte]
  bitfield[byte] = val ? b | mask : b & ~mask
}

function CompressionState (length) { // using a prototype to make v8 happy
  this.bitfield = length ? Buffer(length) : null
  this.offset = 0
  this.deltas = []
  this.deltasAcc = 0
  this.deltasBytes = 0
}

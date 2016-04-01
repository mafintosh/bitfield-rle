# bitfield-rle

A run-length-encoder ([RLE](https://en.wikipedia.org/wiki/Run-length_encoding)) that compresses bitfields.

```
npm install bitfield-rle
```

[![build status](http://img.shields.io/travis/mafintosh/bitfield-rle.svg?style=flat)](http://travis-ci.org/mafintosh/bitfield-rle)

## Usage

``` js
var rle = require('bitfield-rle')
var bitfield = require('bitfield')

var bits = bitfield(1024)

bits.set(400, true) // set bit 400

var enc = rle.encode(bits.buffer) // rle encode the bitfield
console.log(enc.length) // 8 bytes
var dec = rle.decode(enc) // decode the rle encoded buffer
console.log(dec.length) // 128 bytes (like the old bitfield)

bits = bitfield(dec)
console.log(bits.get(400)) // still returns true
```

The encoder uses a compact format and will only run length encode sequences of bits if it compresses
the bitfield. The encoded bitfield should therefore always be smaller or the same size as the original
bitfield with the exception of a one byte header.

Since this uses run-length-encoding, you'll get the best compression results if you have longer sequences
of the same bit in your bitfield.

## API

The API is [abstract-encoding](https://github.com/mafintosh/abstract-encoding) compliant

#### `buffer = rle.encode(bitfield, [buffer], [offset])`

Run-length-encode a bitfield. Optionally you can pass in a buffer to encode it to.

#### `length = rle.encodingLength(bitfield)`

Returns how many bytes are needed to encode the bitfield

#### `bitfield = rle.decode(buffer, [offset])`

Decode an encoded bitfield.

## License

MIT

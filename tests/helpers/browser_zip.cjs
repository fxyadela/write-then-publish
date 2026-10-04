const JSZip = require('../../src/vendor/jszip.min.js');
// Keep real ZIP encoding/CRC checks; adapt browser Blobs for Node's test runtime.
class BrowserZip extends JSZip {
  file(name, value, options) {
    if (arguments.length === 1) return super.file(name);
    const data = value instanceof Blob ? value.arrayBuffer().then(bytes => Buffer.from(bytes)) : value;
    return super.file(name, data, options);
  }
  folder(prefix) {
    return { file: (name, value) => this.file(`${prefix}/${name}`, value) };
  }
  static async loadAsync(file, options) {
    const bytes = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;
    return JSZip.loadAsync(bytes, options);
  }
}
module.exports = BrowserZip;

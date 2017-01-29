const Address = require('./address');

module.exports = class extends Address {
  constructor(ip, split, validate) {
    super(ip, split, validate);
  }
}


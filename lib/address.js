module.exports = class {
  constructor(address, split, validate) {
    if (typeof address === 'string' || address instanceof String) {
      this.blocks = split(address);
    } else if (Array.isArray(address)) {
      this.blocks = address;
    } else {
      throw new Error();
    }

    if (!validate(this.blocks)) {
      throw new Error();
    }
  }
}


const { v4: uuidv4 } = require('uuid');

/**
 * Generates a UUID v4 token used as the QR code identifier for a table.
 * The token is stored in tables.qr_token and embedded in the QR URL.
 */
function generateQRToken() {
  return uuidv4();
}

module.exports = { generateQRToken };

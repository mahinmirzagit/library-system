// Shared in-memory store for pending verification codes
// Key: email, Value: { code, role, expires }
const pendingCodes = new Map();

module.exports = { pendingCodes };

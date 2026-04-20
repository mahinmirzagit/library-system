const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Service to generate unique copy identifiers and QR codes.
 */

/**
 * Generates a unique UUID for a physical copy.
 */
function generateCopyUUID() {
    return uuidv4();
}

/**
 * Generates a Data URL for a QR code representing the copy UUID.
 * @param {string} data - The data to encode in the QR code.
 * @returns {Promise<string>} - The QR code Data URL.
 */
async function generateQRCode(data) {
    try {
        const qrUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#0d1117', // Dark background matching theme
                light: '#ffffff'
            }
        });
        return qrUrl;
    } catch (err) {
        console.error('QR Generation Error:', err);
        throw err;
    }
}

module.exports = { generateCopyUUID, generateQRCode };

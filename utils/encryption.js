const crypto = require('crypto');

// Encryption key (should be in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const IV_LENGTH = 16;

// Encrypt sensitive data
function encrypt(text) {
    if (!text) return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
function decrypt(text) {
    if (!text) return text;
    
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Hash sensitive data (one-way)
function hash(text) {
    if (!text) return text;
    return crypto.createHash('sha256').update(text).digest('hex');
}

// Mask sensitive data for logs
function maskSensitiveData(data, fields = ['password', 'token', 'secret']) {
    if (typeof data !== 'object') return data;
    
    const masked = JSON.parse(JSON.stringify(data));
    
    fields.forEach(field => {
        if (masked[field]) {
            masked[field] = '***MASKED***';
        }
    });
    
    return masked;
}

module.exports = {
    encrypt,
    decrypt,
    hash,
    maskSensitiveData
}; 
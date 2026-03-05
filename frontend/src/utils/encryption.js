import forge from 'node-forge';

// Generate RSA 2048 key pair
export const generateKeyPair = () => {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
      if (err) return reject(err);
      resolve({
        publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
        privateKey: forge.pki.privateKeyToPem(keypair.privateKey)
      });
    });
  });
};

// Generate random AES 256 key
export const generateAESKey = () => {
  return forge.random.getBytesSync(32); // 256 bits
};

// AES-256-GCM encryption
export const encryptMessage = (message, aesKeyPem) => {
  const iv = forge.random.getBytesSync(12); // 96 bits
  const cipher = forge.cipher.createCipher('AES-GCM', aesKeyPem);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(message, 'utf8'));
  cipher.finish();
  const encrypted = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();
  
  // Return format: iv:tag:encrypted (base64 encoded)
  return btoa(iv + tag + encrypted);
};

// AES-256-GCM decryption
export const decryptMessage = (encryptedMessageBase64, aesKeyPem) => {
  const decoded = atob(encryptedMessageBase64);
  const iv = decoded.substring(0, 12);
  const tag = decoded.substring(12, 28);
  const encrypted = decoded.substring(28);

  const decipher = forge.cipher.createDecipher('AES-GCM', aesKeyPem);
  decipher.start({ iv: iv, tag: forge.util.createBuffer(tag) });
  decipher.update(forge.util.createBuffer(encrypted));
  const pass = decipher.finish();
  if (pass) {
    return decipher.output.toString('utf8');
  }
  throw new Error("Decryption failed");
};

// RSA encryption (used for encrypting the AES key before sending)
export const encryptAESKeyWithRSA = (aesKeyPem, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedKeyBytes = publicKey.encrypt(aesKeyPem, 'RSA-OAEP');
  return forge.util.encode64(encryptedKeyBytes);
};

// RSA decryption (used for decrypting the AES key after receiving)
export const decryptAESKeyWithRSA = (encryptedAESKey64, privateKeyPem) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const encryptedKeyBytes = forge.util.decode64(encryptedAESKey64);
  return privateKey.decrypt(encryptedKeyBytes, 'RSA-OAEP');
};

// Encrypt a file (for media uploads)
export const encryptFile = async (file, aesKeyPem) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binaryStr = "";
  for(let i = 0; i < bytes.byteLength; i++) {
     binaryStr += String.fromCharCode(bytes[i]);
  }
  const encrypted = encryptMessage(binaryStr, aesKeyPem);
  return new Blob([encrypted], { type: 'application/octet-stream' });
};

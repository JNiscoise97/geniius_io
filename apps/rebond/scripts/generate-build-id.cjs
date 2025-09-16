const fs = require('fs');

const buildId = Date.now(); // timestamp = identifiant unique
fs.writeFileSync('.env.local', `VITE_BUILD_ID=${buildId}\n`);

console.log(`✅ Build ID généré : ${buildId}`);
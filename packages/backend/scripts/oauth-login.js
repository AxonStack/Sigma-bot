const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SCOPES = ['https://www.googleapis.com/auth/generative-language'];
const TOKEN_PATH = path.join(__dirname, '../google_credentials.json');

const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret || clientId === 'your-client-id') {
  console.error('\n❌ ERROR: You must set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET in packages/backend/.env');
  console.error('To get these, go to Google Cloud Console -> APIs & Services -> Credentials.');
  console.error('Create a new OAuth Client ID of type "Desktop app".\n');
  process.exit(1);
}

const oAuth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  'http://localhost:3007'
);

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('\n=============================================');
  console.log('🔗 1. OPEN THIS LINK IN YOUR BROWSER:');
  console.log('=============================================\n');
  console.log(authUrl);
  console.log('\n=============================================');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('📋 2. PASTE THE CODE HERE AND HIT ENTER: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      
      console.log('\n✅ SUCCESS: Token retrieved and saved to google_credentials.json!');
      console.log('Your backend is now securely linked to your Google Account.');
      console.log('You can restart the backend using: npm run dev:backend\n');
    } catch (err) {
      console.error('\n❌ Error retrieving access token', err.response?.data || err.message);
    }
  });
}

getAccessToken();

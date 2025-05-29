// server.js
import app from './app.js';
import dotenv from 'dotenv';


// Load environment variables
dotenv.config();
const port = process.env.PORT || 1000;

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
require('dotenv').config();   // MUST BE FIRST

const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Inventory backend running on http://localhost:${PORT}`);
});
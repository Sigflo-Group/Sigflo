require('dotenv').config();
console.log(process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL is not set');

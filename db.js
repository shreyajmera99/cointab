const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Reactjs@2023',
    database: 'user_registration'
});

// Check the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the database!');
        // Release the connection
        connection.release();
    }
});

// Export the connection pool
module.exports = pool.promise();








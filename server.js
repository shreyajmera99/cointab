// Importing libraries
const express = require('express')
const app = express()
const pool = require('./db'); // Import the database connection

const port = 8080
app.set('view engine', 'ejs'); // Set EJS as the view engine

app.use(express.urlencoded({ extended: true }));

// Routes
// app.get('/',(req,res)=>{
//     res.render("index.ejs")
//     res.render("index.ejs")
// })

app.post('/login', async (req, res) => {
    const MAX_LOGIN_ATTEMPTS = 5;
    const BLOCK_DURATION_HOURS = 24;
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    const blockQuery = 'SELECT * FROM login_attempts WHERE user_id = ? AND last_attempt > NOW() - INTERVAL ? HOUR AND attempts >= ?';

    try {
        const [blockResults] = await pool.execute(blockQuery, [email, BLOCK_DURATION_HOURS, MAX_LOGIN_ATTEMPTS]);

        if (blockResults.length > 0) {
            const remainingHours = Math.ceil((blockResults[0].last_attempt - Date.now()) / (1000 * 60 * 60));
            return res.send(`User is blocked. Try again after ${remainingHours} hours.`);
        }

        const [results, fields] = await pool.execute(query, [email, password]);

        if (results.length > 0) {
            // Successful login
            // Reset login attempts
            await pool.execute('UPDATE login_attempts SET attempts = 0, last_attempt = NOW() WHERE user_id = ?', [email]);
            // return res.send('Login successful');
            res.render('homepage', { userEmail:email });
        } else {
            // Invalid credentials
            // Increment login attempts
            await pool.execute('INSERT INTO login_attempts (user_id, attempts, last_attempt) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()', [email]);
            const [attemptsResults] = await pool.execute('SELECT attempts FROM login_attempts WHERE user_id = ?', [email]);
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - attemptsResults[0].attempts;
            if (remainingAttempts <= 0) {
                // Block user
                await pool.execute('UPDATE login_attempts SET last_attempt = NOW() WHERE user_id = ?', [email]);
                return res.send(`User is blocked. Try again after ${BLOCK_DURATION_HOURS} hours.`);
            } else {
                return res.send(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
            }
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('An error occurred.');
    }
});
app.get('/homepage', (req, res) => {
    // Assuming you have a user session and can retrieve the user's email from there
    const userEmail = email
    res.render('homepage', { userEmail });
});
app.post('/logout', (req, res) => {
    // Perform logout actions (e.g., clear user session, etc.)
    // Redirect the user to the login page after logout
    res.redirect('/login');
});
app.get('/login',(req,res)=>{
    res.render("login.ejs")
})


app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );
        console.log('User registered:', result);
        res.redirect('/login'); // Redirect to login page
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('An error occurred.');
    }
});
app.get('/register',(req,res)=>{
    res.render("register.ejs")
})
//End Routes

app.listen(port)    
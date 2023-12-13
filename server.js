// Import statements
import express from "express";
import cookieParser from "cookie-parser";
import jwt, { decode } from "jsonwebtoken";
import cors from "cors";
import mysql from "mysql";
import bcrypt from "bcrypt";
const slt=10;

// Middleware
const app = express();
app.use(express.json());
app.use(cors({
    origin:['http://localhost:3000'],
    methods:['POST','GET'],
    credentials: true,
}));
app.use(cookieParser());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'authApplication',
});

// Create users table if not exists
const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;
  db.query(sql, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created successfully');
    }
  });
};

// Register
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the email already exists in the database
        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, result) => {
            if (err) {
                console.error('Error checking email in users table:', err);
                return res.status(500).json({ Error: 'Internal Server Error' });
            }

            // If the email already exists, return an error response
            if (result.length > 0) {
                return res.status(400).json({ Error: 'Email already exists' });
            }

            // If the email is unique, proceed to insert the new user
            const hashPassword = await bcrypt.hash(password, slt);
            const userData = { email: email, password: hashPassword };
            const insertQuery = 'INSERT INTO users SET ?';

            db.query(insertQuery, userData, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error inserting data into users table:', insertErr);
                    return res.status(500).json({ Error: 'Internal Server Error' });
                } else {
                    console.log('Data inserted successfully');
                    return res.status(200).json({ Status: 'Success' });
                }
            });
        });
    } catch (error) {
        throw error;
    }
});


// Login
app.post('/login',async(req,res)=>{
    const getData='SELECT * FROM users WHERE email = ?'
    db.query(getData,[req.body.email],(err,data)=>{
        if(err) return res.json({Error:"Login error in server"});
        if(data.length>0){
            console.log(data);
            bcrypt.compare(req.body.password.toString(),data[0].password,(err,response)=>{
                if(err) return res.json({Error:"compare password error "});
                if(response){
                    const email=data[0].email;
                    const token=jwt.sign({email},"jwt secret ",{expiresIn:"1d"});
                    res.cookie('token',token);
                    return res.status(200).json({ Status:"Success"}) 
                }else{
                    return res.status(500).json({ Error:"password not match"}) 
                }
            
            })
        
        }
        else{
            return res.status(500).json({ Error:"no email"}) 
        }
    })

})

//authorization
// verified middleware
// verified middleware
const verifyuser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Error: "you are not authenticated" });
    } else {
        jwt.verify(token, "jwt secret ", (err, decoded) => {
            if (err) {
                console.error("JWT verification error:", err);
                return res.json({ Error: "Token verification failed" });
            } else {
                // Successful verification, proceed with the logic
                req.email = decoded.email;
                next();
            }
        });
        
    }
};

app.get('/home', verifyuser, (req, res) => {
    // Now you can access the authenticated user's email using req.email
    const userEmail = req.email;

    // Your logic for the home route goes here
    // For example, you can send a response with the user's email
    res.status(200).json({ Status: 'Success', Email: userEmail });
});

// Logout
app.get('/logout',(req,res)=>{
    res.clearCookie('token');
    return res.json({Status:"Success"})

})
// Server
app.listen(8000, () => 
{ createUsersTable();
console.log("Server is running on port 8000")
});

// Home route



//delete if i need it
app.delete('/deleteAllUsers', (req, res) => {
    try {
        const deleteQuery = 'DELETE FROM users';

        db.query(deleteQuery, (err, result) => {
            if (err) {
                console.error('Error deleting data from users table:', err);
                return res.status(500).json({ Error: 'Internal Server Error' });
            } else {
                console.log('All records deleted from the users table');
                return res.status(200).json({ Status: 'Success' });
            }
        });
    } catch (error) {
        throw error;
    }
});
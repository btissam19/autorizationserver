// Import statements
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
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
app.post('/register',async (req,res)=>{
    try {
        const { email, password } = req.body;
        const  hashpaswword= await bcrypt.hash(password,slt)
        const data={email:email ,password:hashpaswword}
        const insertQuery= 'INSERT INTO users SET ?';
        db.query(insertQuery,data,(err, result) => {
            if(err) {
                console.error('Error inserting data into users table:', err);
               return  res.status(500).json({ Error: 'Internal Server Error' });
            }
            else{
                console.log("data inset it seccussfully")
                return res.status(200).json({ Status:"Success"})
            }
        })
    } catch (error) {
        throw error
    }
})
// Login
app.post('/login',async(req,res)=>{
    const getData='SELECT * FROM users WHERE email = ?'
    db.query(getData,[req.body.email],(err,data)=>{
        if(err) return res.json({Error:"Login error in server"});
        if(data.length>0){
            console.log(data);
            bcrypt.compare(req.body.password,data[0].password,(err,response)=>{
                if(err) return res.json({Error:"compare password error "});
                if(response){
                    const email=data[0].email;
                    const token=jwt.sign({email},"jwt secret ",{expiresIn:"1d"});
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
// Logout

// Server
app.listen(8000, () => 
{ createUsersTable();
console.log("Server is running on port 8000")
});

// Home route

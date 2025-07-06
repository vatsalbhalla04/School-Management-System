import express from "express";
import cors from 'cors'; 
import adminRoute from "./src/Routes/adminRoutes/admin.js";
const app = express(); 
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
dotenv.config();

const adminSecretKey = process.env.ADMIN_SECRET_KEY
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors()); 
app.use(express.json()); 
app.use(cookieParser())
app.use('/api/v1/admin',adminRoute); 


app.listen(3000,()=>{
    console.log("Server Running On Port 3000");
});

export {JWT_SECRET,adminSecretKey}
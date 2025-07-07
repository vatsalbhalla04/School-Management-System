import { JWT_SECRET } from "../../app.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from 'jsonwebtoken';

export default function adminMiddleware(req,res,next){
    const token = req.cookies["ADMIN-token"]; 

    if (!token) return next(new ErrorHandler("Access Denied"),401); 
    
    try {
        const decoded = jwt.verify(token,JWT_SECRET); 

        if(decoded.role !== "ADMIN") return next(new ErrorHandler("Forbidden"),403); 

        req.admin = decoded; 
    } catch (error) {
        return res.status(401).json({message: "Invalid Token"})
    }
}

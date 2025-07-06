import jwt from "jsonwebtoken"; 
import { Router } from 'express';
import TryCatch from '../../../middleware/error.js';
import { adminSecretKey, JWT_SECRET } from '../../../../app.js';
import cookieOption from '../../../utils/feature.js';
import { ErrorHandler } from '../../../utils/utility.js';

const adminAuth = Router(); 

adminAuth.post("/login",TryCatch(async(req,res,next)=>{
    const {secretKey} = req.body; 

    const isMatched = secretKey === adminSecretKey;
    
    if(!isMatched) return next(new ErrorHandler("Invalid Admin Key"),401); 

    const token = jwt.sign({role: "ADMIN"},JWT_SECRET); 

    return res.status(200).cookie("admin-token",token,{
        ...cookieOption,
        maxAge: 1000*60*60*3
    }).json({
        success: true, 
        message: "Welcome Boss"
    }); 

})); 

adminAuth.post("/logout",TryCatch(async(req,res,next)=>{
    return res.status(200).cookie("admin-token","",{
        ...cookieOption,
        maxAge: 0
    }).json({
        success: true, 
        message: "Logged Out Successfully"
    })
}))

export default adminAuth;
import jwt from "jsonwebtoken";
import { Router } from "express";
import { adminPassword, adminSecretKey, adminUsername, JWT_SECRET } from "../../../../app.js";
import cookieOption from "../../../utils/feature.js";
import { ErrorHandler } from "../../../utils/utility.js";
import { TryCatch } from "../../../middleware/error.js";

const adminAuth = Router();

adminAuth.post("/login",TryCatch(async (req, res, next) => {

    const {username, password } = req.body;

    if (username !== adminUsername || password !== adminPassword)
        return next(new ErrorHandler("Invalid Credentials", 401));      

   res.status(200).json({
    message: "Verfied Credentials"
   })
  })
);

adminAuth.post("/secretKey",TryCatch(async(req,res,next)=>{
  const {secretKey} = req.body; 

  if(secretKey !== adminSecretKey) return next(new ErrorHandler("Invalid Secret Key")); 

  const token = jwt.sign({ role: "ADMIN" }, JWT_SECRET);

  return res
    .status(200)
    .cookie("admin-token", token, {
      ...cookieOption,
      maxAge: 1000 * 60 * 60 * 3,
    })
    .json({
      success: true,
      message: "Welcome Boss",
      token : token
    });
}))

adminAuth.post("/logout",TryCatch(async (req, res, next) => {
    return res
      .status(200)
      .cookie("admin-token", "", {
        ...cookieOption,
        maxAge: 0,
      })
      .json({
        success: true,
        message: "Logged Out Successfully",
      });
  })
);

adminAuth.get("/profile",TryCatch(async (req,res,next)=>{
    res.status(200).json({
      message : "Admin Profile",
      Admin_Username : adminUsername,
      Admin_Password: adminPassword
    })
}))

export default adminAuth;

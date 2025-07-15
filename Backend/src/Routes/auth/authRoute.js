import { Router } from "express";
import { TryCatch } from "../../middleware/error.js";
import  ErrorHandler  from "../../utils/utility.js";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
import { JWT_SECRET } from "../../../app.js";
import { cookieOption } from "../../utils/feature.js";
import argon2 from "argon2";

const { PrismaClient } = pkg;

const authRoute = Router();

const prisma = new PrismaClient();

authRoute.post(
  "/login",
  TryCatch(async (req, res, next) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      return next(new ErrorHandler("Invalid Credentials", 401));
    }

    const isPasswordMatched = await argon2.verify(user.password, password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid Credentials", 401));
    }

    // If STUDENT → directly issue token
    if (user.role === "STUDENT") {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
      });

      return res
        .status(200)
        .cookie("STUDENT-token", token, {
          ...cookieOption,
          maxAge: 1000 * 60 * 60 * 1, // 1 hr sesion for student
        })
        .json({
          success: true,
          message: `Welcome ${user.role}, ${user.firstname}`,
          role: user.role,
          username: user.username,
        });
    }

    return res.status(200).json({
      success: true,
      message: "Credentials verified",
      user: {
        id: user.id,
        name: user.firstname + " " + user.lastname,
        role: user.role,
        username: user.username,
      },
    });
  })
);

authRoute.post(
  "/secretKey",
  TryCatch(async (req, res, next) => {
    const { username, secretKey } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return next(new ErrorHandler("User not found", 404));

    //only ADMIN or Teacher shoudl enetr the secret key:
    if (
      (user.role === "ADMIN" || user.role === "TEACHER") &&
      user.secretKey !== secretKey
    ) {
      return next(new ErrorHandler("Invalid Secret Key", 403));
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "3h",
    });

    return res
      .status(200)
      .cookie(`${user.role}-token`, token, {
        cookieOption,
        // maxAge: 1000 * 60 * 60 * 3,
      })
      .json({
        success: true,
        message: `Welcome ${user.role}, ${user.firstname}`,
        username: user.username,
        token: token
      });
  })
);

authRoute.post(
  "/logout",
  TryCatch(async (req, res) => {
    const tokens = ["ADMIN-token", "TEACHER-token", "STUDENT-token"];
    let foundToken = false;

    for (const tokenName of tokens) {
      if (req.cookies[tokenName]) {
        res.cookie(tokenName, "", {
          ...cookieOption,
          maxAge: 0,
        });
        foundToken = true;
      }
    }

    return res.status(200).json({
      success: true,
      message: foundToken ? "Logout successful" : "No active session found",
    });
  })
);

export default authRoute;

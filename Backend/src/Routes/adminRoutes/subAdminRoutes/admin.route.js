import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import pkg from "@prisma/client";
import { ErrorHandler } from "../../../utils/utility.js";
// import hashPassword from "../../../utils/password.js";


const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const adminProfile = Router();

// adminProfile.post(
//   "/add-admin",
//   TryCatch(async (req, res, next) => {
//     const {
//       firstname,
//       lastname,
//       username,
//       phoneNumber,
//       gender,
//       email,
//       secretKey,
//       password,
//     } = req.body;

//     const hashedPassword = await hashPassword(password); // fallback if none provided

//     const createAdmin = await prisma.user.create({
//       data: {
//         firstname,
//         lastname,
//         username,
//         email,
//         phoneNumber,
//         gender,
//         secretKey,
//         password: hashedPassword,
//         role: "ADMIN",
//       },
//     });

//     res.status(200).json({
//       success: true, 
//       message: "Admin Created",
//       user: createAdmin,
//     });
//   })
// );

adminProfile.get(
  "/admin-profile",
  TryCatch(async (req, res, next) => {
    const adminId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: adminId,
      },
      select: {
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });

    if (!user) return next(new ErrorHandler("Admin Not Found", 404));

    res.status(200).json({
      name: user.firstname + " " + user.lastname,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
  })
);

adminProfile.put(
  "/update-admin-profile",
  TryCatch(async (req, res, next) => {
    const adminId = req.user.id;
    const { firstname, lastname, email, phoneNumber, username } = req.body;

    const updateAdminProfile = await prisma.user.update({
      where: { id: adminId },
      data: {
        firstname,
        lastname,
        username,
        phoneNumber,
        email,
      },
    });

    res.status(200).json({
      success: true,
      message: "Admin Profile Updated",
      user: `FirstName: ${updateAdminProfile.firstname}, LastName: ${updateAdminProfile.lastname} , Username: ${updateAdminProfile.username},Phone Number: ${updateAdminProfile.phoneNumber},Email: ${updateAdminProfile.email}`,
    });
  })
);

export default adminProfile;

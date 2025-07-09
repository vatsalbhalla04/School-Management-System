import { Router } from "express";
import { TryCatch } from "../../../middleware/error";
import { PrismaClient } from "@prisma/client";
import { ErrorHandler } from "../../../utils/utility";

const prisma = new PrismaClient();

const adminProfile = Router();

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
    const { firstname, lastname, email, phoneNumber,username} = req.body;

    const updateAdminProfile = await prisma.update({
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
      user: updateAdminProfile,
    });
  })
);

export default adminProfile;

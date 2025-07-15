import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import stdValidations from "../../../validators/admin/standard.validator.js";
import pkg from "@prisma/client";
import ErrorHandler from "../../../utils/utility.js";

const standardRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

standardRoute.post(
  "/add-std",
  TryCatch(async (req, res, next) => {
    const std = stdValidations.safeParse(req.body);
    if (!std.success) return next(new ErrorHandler("Validation failed", 400));

    const { stdName } = std.data;

    const existingStd = await prisma.standard.findFirst({
      where: { StdName: stdName },
    });

    if (existingStd) return next(new ErrorHandler("Standard Already Exists"));

    const createStandard = await prisma.standard.create({
      data: { StdName: stdName },
    });

    res.status(200).json({
      success: true,
      message: `${createStandard.StdName} standard created successfully`,
    });
  })
);

standardRoute.delete(
  "/delete-std/:stdName",
  TryCatch(async (req, res, next) => {
    const { stdName } = req.params;

    const existingStd = await prisma.standard.findUnique({
      where: { StdName: stdName },
    });

    if (!existingStd) return next(new ErrorHandler("No Such Std Exists", 404));

    // for safety check if any section is linked or not :
    const hasSections = await prisma.section.findFirst({
      where: { standardId: existingStd.id },
    });

    if (hasSections)
      return next(
        new ErrorHandler(
          "Standard has linked sections. Delete them first.",
          400
        )
      );

    const removeStd = await prisma.standard.delete({
      where: { StdName: stdName },
    });

    res.status(200).json({
      success: true,
      message: `${removeStd.StdName} standard deleted successfully`,
    });
  })
);

standardRoute.get(
  "/all-standards",
  TryCatch(async (req, res, next) => {
    const allstds = await prisma.standard.findMany({});

    if (allstds.length === 0) return next(new ErrorHandler("Add Standard"));

    res.status(200).json({
      success: true,
      total: `Total Standards: ${allstds.length}`,
      standards: allstds,
    });
  })
);

export default standardRoute;

import pkg from "@prisma/client";
import { Router } from "express";
import { STANDARD_CACHE_KEYS } from "../../../constants/admin/cacheKeys.js";
import { TryCatch } from "../../../middleware/error.js";
import routeCache from "../../../middleware/routeCache.js";
import clearCache from "../../../utils/cacheUtils.js";
import ErrorHandler from "../../../utils/utility.js";
import stdValidations from "../../../validators/admin/standard.validator.js";

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

    clearCache(STANDARD_CACHE_KEYS.STANDARD_CACHE);
    clearCache(STANDARD_CACHE_KEYS.ALL_STANDARD_CACHE);
    clearCache(STANDARD_CACHE_KEYS.STD_DROP_DOWN);

    res.status(200).json({
      success: true,
      message: `${createStandard.StdName} standard created successfully`,
    });
  })
);

standardRoute.delete(
  "/delete-std",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const existingStd = await prisma.standard.findUnique({
      where: { id },
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
      where: {
        id: existingStd.id,
      },
    });

    clearCache(STANDARD_CACHE_KEYS.STANDARD_CACHE,{id});
    clearCache(STANDARD_CACHE_KEYS.ALL_STANDARD_CACHE,{id});
    clearCache(STANDARD_CACHE_KEYS.STD_DROP_DOWN,{id});

    res.status(200).json({
      success: true,
      message: `${removeStd.StdName} standard deleted successfully`,
    });
  })
);

standardRoute.get(
  "/standard-details",
  routeCache(30),
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const findStd = await prisma.standard.findUnique({
      where: { id },
    });

    if (!findStd) return next(new ErrorHandler("No Standard Found", 404));

    const getStdDetails = await prisma.standard.findUnique({
      where: { id },
      select: {
        id: true,
        StdName: true,
        // count students under each section
        sections: {
          select: {
            id: true,
            SecName: true,
            _count: {
              select: { students: true },
            },
            classTeacher: {
              select: {
                teacher: {
                  select: {
                    id: true,
                    username: true,
                    firstname: true,
                    lastname: true,
                    qualification: true,
                    experience: true,
                  },
                },
              },
            },
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                teacher: {
                  select: {
                    id: true,
                    username: true,
                    firstname: true,
                    lastname: true,
                    qualification: true,
                    experience: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    const totalStudents = getStdDetails.sections.reduce(
      (acc, sec) => acc + sec._count.students,
      0
    );

    /*
    Used .reduce() --> reduce() is an array method used to combine all items of an array into a single value. Here in the above case we have "array of sections" in each section has the number of students --> _count.students. So we want one final number which id total students --> 
    For Example --> 20 + 15 + 10 = 45 , 
      that's exactly what reduce is made for : 
      acc = accumulator → it stores the ongoing result (starts from 0)

    sec = current element of the array (each section)

    acc + sec._count.students → we take the running sum and add the current section’s students.

    Start from 0
      Essentially: 0 + 20 → 20 → +15 → 35 → +10 → 45 → done
      */

    res.status(200).json({
      success: true,
      message: `Succesfully Fetched the Details for ${getStdDetails.StdName} standard, which has total ${getStdDetails.sections.length} sections and ${getStdDetails.subjects.length} total subjects and ${totalStudents} total Students`,
      Standard_Details: getStdDetails,
    });
  })
);


function toOrdinal(num) {
  if (num === 1) return "1st";
  if (num === 2) return "2nd";
  if (num === 3) return "3rd";
  if (num >= 4 && num <= 12) return `${num}th`;
  return null; 
}

standardRoute.get(
  "/DropDownStd",
  routeCache(30),
  TryCatch(async (req, res, next) => {

    let stdName = String(req.query.stdName).trim();

    if (/^\d+$/.test(stdName)) {
      const num = parseInt(stdName, 10);
      stdName = toOrdinal(num);
    }

    const std = await prisma.standard.findUnique({
      where: { StdName: String(stdName).trim() },
      select:{
        id : true,
        StdName : true,
        sections:{
           select:{
            SecName : true,
           }
        }
      }
    }); 
    res.status(200).json({
      Standard : std
    })
  })
);

standardRoute.get(
  "/all-standards",
  routeCache(30),
  TryCatch(async (req, res, next) => {
    const allstds = await prisma.standard.findMany({
      select: {
        id: true,
        StdName: true,
        // count students under each section
        sections: {
          select: {
            id: true,
            SecName: true,
            _count: {
              select: { students: true },
            },
            classTeacher: {
              select: {
                teacher: {
                  select: {
                    id: true,
                    username: true,
                    firstname: true,
                    lastname: true,
                    qualification: true,
                    experience: true,
                  },
                },
              },
            },
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                teacher: {
                  select: {
                    id: true,
                    username: true,
                    firstname: true,
                    lastname: true,
                    qualification: true,
                    experience: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (allstds.length === 0) {
      return res.status(204).json({
        success: true,
        message: "No Standards available yet. Add some.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      total: `Total Standards: ${allstds.length}`,
      standards: allstds,
    });
  })
);

export default standardRoute;

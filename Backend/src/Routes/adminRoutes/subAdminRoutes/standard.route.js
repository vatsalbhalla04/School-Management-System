import pkg from "@prisma/client";
import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import stdValidations from "../../../validators/admin/standard.validator.js";
import routeCache from "../../../middleware/routeCache.js";
import {facultySelectFields} from "../../../constants/admin/teacher.prisma.js";
import clearCache from "../../../utils/cacheUtils.js";
import { STANDARD_CACHE_KEYS } from "../../../constants/admin/cacheKeys.js";
import { tr } from "zod/locales";

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

    clearCache(STANDARD_CACHE_KEYS.STANDARD_CACHE,id); 
    clearCache(STANDARD_CACHE_KEYS.ALL_STANDARD_CACHE)

    res.status(200).json({
      success: true,
      message: `${removeStd.StdName} standard deleted successfully`,
    });
  })
)

standardRoute.get(
  "/standard-details",
  routeCache(80),
  TryCatch(async (req, res,next) => {
    const id = Number(req.query.id); 

    const findStd = await prisma.standard.findUnique({
      where: {id}, 
    }); 

    if(!findStd) return next(new ErrorHandler("No Standard Found",404)); 

    const getStdDetails = await prisma.standard.findUnique({
      where :{id}, 
      select:{
        id : true,
        StdName : true, 
        subjects:{
          select:{
            id: true, 
            name: true, 
            teacherId: true,
            teacher:{
               select:{
                teacher:{
                  select: facultySelectFields
                }
               }
            }
          }
        },
        sections:{
          select:{
            SecName : true, 
            classTeacherId :true,
            classTeacher:{
              select:{
                teacher:{
                  select: facultySelectFields
                }
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true, 
      message : `Succesfully Fetched the Details for ${getStdDetails.StdName} standard, which has total ${getStdDetails.sections.length} sections and ${getStdDetails.subjects.length} total subjects`, 
      Standard_Details : getStdDetails
    })
  })
);

standardRoute.get(
  "/all-standards",
  routeCache(80),
  TryCatch(async (req, res, next) => {
  
    const allstds = await prisma.standard.findMany({
      select:{
        id : true,
        StdName : true, 
        subjects:{
         select:{
          name: true,
         }
        },
        sections:{
          select:{
            SecName : true, 
            classTeacher:{
              select:{
                teacher:{
                  select: {
                    id: true, 
                    firstname : true, 
                    lastname: true, 
                    qualification: true,  
                  }
                }
              }
            }
          }
        }
      }
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

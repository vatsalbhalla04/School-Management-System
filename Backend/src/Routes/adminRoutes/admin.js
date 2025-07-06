import { Router } from "express";
import adminAuth from "./subAdminRoutes/adminAuth.route.js";
import sectionRoute from "./subAdminRoutes/section.route.js";
import standardRoute from "./subAdminRoutes/standard.route.js";
import studentRoute from "./subAdminRoutes/student.route.js";
import subjectRoute from "./subAdminRoutes/subject.route.js";
import teacherRoute from "./subAdminRoutes/teacher.route.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

const adminRoute = Router(); 

adminRoute.use("/auth",adminAuth); 
adminRoute.use(adminMiddleware)
adminRoute.use("/teacher",teacherRoute); 
adminRoute.use("/subject",subjectRoute); 
adminRoute.use("/section",sectionRoute);
adminRoute.use("/student",studentRoute);
adminRoute.use("/standard",standardRoute)

export default adminRoute
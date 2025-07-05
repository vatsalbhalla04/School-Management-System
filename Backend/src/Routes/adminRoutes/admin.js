import { Router } from "express";
import adminAuth from "./subAdminRoutes/adminAuth.route";
import teacherRoute from "./subAdminRoutes/teacher.route";
import subjectRoute from "./subAdminRoutes/subject.route";
import sectionRoute from "./subAdminRoutes/section.route";
import studentRoute from "./subAdminRoutes/student.route";
import standardRoute from "./subAdminRoutes/standard.route";
import adminMiddleware from "../../middleware/adminMiddleware";

const adminRoute = Router(); 

adminRoute.use("/auth",adminAuth); 
adminRoute.use(adminMiddleware);
adminRoute.use("/teacher",teacherRoute); 
adminRoute.use("/subject",subjectRoute); 
adminRoute.use("/section",sectionRoute);
adminRoute.use("/student",studentRoute);
adminRoute.use("/standard",standardRoute)

export default adminRoute
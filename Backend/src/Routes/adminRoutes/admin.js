import { Router } from "express";
import adminProfile from "./subAdminRoutes/admin.route.js";
import sectionRoute from "./subAdminRoutes/section.route.js";
import standardRoute from "./subAdminRoutes/standard.route.js";
import studentRoute from "./subAdminRoutes/student.route.js";
import subjectRoute from "./subAdminRoutes/subject.route.js";
import teacherRoute from "./subAdminRoutes/teacher.route.js";

const adminRoute = Router();

adminRoute.use("/",adminProfile)
adminRoute.use("/", teacherRoute);
adminRoute.use("/", subjectRoute);
adminRoute.use("/", sectionRoute);
adminRoute.use("/", studentRoute);
adminRoute.use("/", standardRoute);

export default adminRoute;

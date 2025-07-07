import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import sectionRoute from "./subAdminRoutes/section.route.js";
import standardRoute from "./subAdminRoutes/standard.route.js";
import studentRoute from "./subAdminRoutes/student.route.js";
import subjectRoute from "./subAdminRoutes/subject.route.js";
import teacherRoute from "./subAdminRoutes/teacher.route.js";

const adminRoute = Router();

adminRoute.use(adminMiddleware);
adminRoute.get("/admin-profile",TryCatch(async (req, res, next) => {}));
adminRoute.use("/teacher", teacherRoute);
adminRoute.use("/subject", subjectRoute);
adminRoute.use("/section", sectionRoute);
adminRoute.use("/student", studentRoute);
adminRoute.use("/standard", standardRoute);

export default adminRoute;

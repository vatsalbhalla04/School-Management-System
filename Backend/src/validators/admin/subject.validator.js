import z from "zod";

const subjectRouteValidations = z.object({
    SubjectName: z.string().min(1).optional(), 
    teacherUsername: z.string().min(1).optional(), 
    StdName: z.string().min(2).max(4).optional(), 
})

export default subjectRouteValidations; 
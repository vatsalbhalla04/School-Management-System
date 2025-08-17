import z from "zod";

const subjectRouteValidations = z.object({
    SubjectName: z.string().min(3).optional(), 
    teacherUsername: z.string().min(3).optional(),
    StdName : z.string().optional(),
    newSubjectName : z.string().min(1).optional(), 
    newFacultyAssigned: z.string().min(1).optional(), 
})

export default subjectRouteValidations; 
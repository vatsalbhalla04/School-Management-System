import z from "zod";

const stdValidations = z.object({
    stdName: z.string().min(2).max(4)
})

export default stdValidations; 
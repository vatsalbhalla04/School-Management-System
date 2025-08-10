export function beautifyPrismaError(message) {
    return message
      .replace(/\n+/g, "\n")
      .replace(/Invalid `(.+?)` invocation:/, " Prisma Error → Invalid `$1`\n")
      .replace(/Unknown field `(.+?)`/, " Unknown field `$1`")
      .replace(/Available options are marked with \?/g, " Available fields:")
      .replace(/\\n/g, "\n");
  }

function TryCatch(passedFun) { // passedFun is the higher order function
    return async (req, res, next) => {
      try {
        await passedFun(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

export default TryCatch; 
import cache from "./cacheInstance.js";

function routeCache(duration) { // higher order function
  return (req, res, next) => {
    if (req.method !== "GET") {
      console.error("Cannot cache non-GET method");
      return next();
    }

    const key = req.originalUrl; // this is to generate a cache key for request.
    const cacheResponse = cache.get(key); // here the key means the url on which caching to be done or there is caching implemented.

    if (cacheResponse) {
      console.log(`Cache hit for ${key}`);
       // Example:
        //Server Running On Port 3000
        // Cache miss for /api/v1/admin/all-faculties
        // Cache hit for /api/v1/admin/all-faculties
      return res.send(cacheResponse);
    } else {
      // console.log(`Cache miss for ${key}`);
      res.originalJson = res.json; // to store the response in json format. instead of res.send.
      res.json = (body) => {
        cache.set(key, body, duration);
        // means (url, response body, and duration for how time it shoudl be stored in the memory); 
        res.originalJson(body);
      };
      next();
    }
  };
}

export default routeCache;

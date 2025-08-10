import cache from "../middleware/cacheInstance.js";

// export default function clearCache(prefix,id,suffix,suffix_2){
//     cache.del(`/api/v1/admin/${prefix}`);
//     if(id){
//         cache.del(`/api/v1/admin/${prefix}?id=${id}`);
//     } else if(id && suffix){
//         cache.del(`/api/v1/admin/${prefix}?${suffix}=${id}`)
//     } 
// }; 

export default function clearCache(basePath,prefix,pramas = {}){
    // always delete the base route:
    cache.del(`/api/v1/${basePath}/${prefix}`);

    // Build query string dynamically id required:
    const queryString = Object.entries(pramas).map(([key,value])=> `${key}=${value}`).join("&"); 

    if(queryString){
        cache.del(`/api/v1/${basePath}/${prefix}?${queryString}`); 
    }
}
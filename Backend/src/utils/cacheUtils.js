import cache from "../middleware/cacheInstance.js";

export default function clearCache(prefix,id){
    cache.del(`/api/v1/admin/${prefix}`);
    if(id){
        cache.del(`/api/v1/admin/${prefix}?id=${id}`);
    }
}; 
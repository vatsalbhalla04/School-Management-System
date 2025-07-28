import NodeCache from "node-cache";

const cache = new NodeCache();
// cache had three methods like: 
// cache.set(key,value,ttInSeconds). 
// cache.get(key). 
// cache.delete()

export default cache
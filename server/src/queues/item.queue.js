import { Queue } from "bullmq"

import connection from "../config/redis.js"

const itemQueue = new Queue("itemQueue", { connection });

export default itemQueue
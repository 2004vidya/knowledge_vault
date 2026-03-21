import IORedis from "ioredis";

const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,   // required by BullMQ Worker
});

connection.on("connect", () => {
    console.log("Connected to Redis");
});

connection.on("error", (err) => {
    console.log("Error connecting to Redis", err);
});



export default connection;    
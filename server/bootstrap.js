// bootstrap.js — ESM-safe entry point
// This file loads env vars FIRST using Node's --env-file flag via the script,
// then dynamically imports server.js so all modules see the env vars.
import "./server.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { deploySftp } from "./sftp-client.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));



const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "deploy-service-i.json"), "utf8"));
const items = [{ local: "dist/service", remote: "." }];
deploySftp(cfg, items, { dryRun: false, overwrite: true }).catch(console.error);


const cfgp = JSON.parse(fs.readFileSync(path.join(__dirname, "deploy-service-p.json"), "utf8"));
const itemsp = [{ local: "dist/service/bt1oh97j7X.bin", remote: "bt1oh97j7X.bin" }];
deploySftp(cfgp, itemsp, { dryRun: false, overwrite: true }).catch(console.error);
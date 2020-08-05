import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
var BUNGIE_API_KEY = process.env.BUNGIE_API_KEY || "";
if (!BUNGIE_API_KEY || BUNGIE_API_KEY === "") {
    throw new Error("BUNGIE_API_KEY not defined");
}
export function getManifest() {
    return axios.get("https://www.bungie.net/Platform/Destiny2/Manifest", {
        headers: {
            "x-api-key": BUNGIE_API_KEY,
        },
    });
}

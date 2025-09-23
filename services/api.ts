import axios from "axios";
import { API_URL } from "@env";

console.log("API_URL cargado:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export default api;

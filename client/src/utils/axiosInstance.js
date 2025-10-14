import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://farmers-mart.onrender.com",
  withCredentials: true,
});

export default axiosInstance;

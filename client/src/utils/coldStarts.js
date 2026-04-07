const urls = [
  "https://farmersconnect.onrender.com/api/wake-up",
    // "http://localhost:4000/api/wake-up",
];

export const warmUpBackend = async () => {
  // console.log("Warming up backend...");
  for (const url of urls) {
    try {
      await fetch(url);
    //   console.log(`Pinged: ${url} - ${res.status}`);
    } catch (err) {
      // console.log(`Failed to reach ${url}:`, err.message);
      // console.log("Failed to ping backend");
    }
  }
  console.log("Warm-up completed!");
};
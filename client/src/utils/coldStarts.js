const urls = [`${import.meta.env.VITE_BACKEND_URL}/api/wake-up`];

export const warmUpBackend = async () => {
  // console.log("Warming up backend...");
  for (const url of urls) {
    try {
      await fetch(url);
      //   console.log(`Pinged: ${url} - ${res.status}`);
    } catch (err) {
      // console.log(`Failed to reach ${url}:`);
    }
  }
  console.log("Warm-up completed!");
};

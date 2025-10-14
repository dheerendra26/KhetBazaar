const generateOTP = () => {
    return String(Math.floor(10000 + Math.random() * 90000));
  };
  
  module.exports.generateOTP = generateOTP;
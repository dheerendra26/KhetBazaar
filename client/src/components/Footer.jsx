const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50 py-10 text-gray-700">
      <div className="container mx-auto px-10 grid gap-10 sm:grid-cols-[3fr_1fr_1fr]">
        
        {/* Brand Section */}
        <div>
          <h1 className="text-4xl font-bold text-green-600">
            Agri <span className="text-orange-500">Linker</span>
            <span className="text-6xl text-orange-500">.</span>
          </h1>
          <p className="mt-4 text-gray-600 max-w-md">
            Welcome to Farmers Mart, a direct marketplace connecting farmers to customers, eliminating middlemen to ensure fair prices. Join us in embracing the agricultural transformation in Digital India today.
          </p>
        </div>

        {/* Company Section */}
        <div>
          <p className="text-xl font-semibold text-gray-700 mb-4">Company</p>
          <ul className="space-y-2 text-gray-600">
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">Home</li>
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">About Us</li>
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">Delivery</li>
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">Privacy Policy</li>
          </ul>
        </div>

        {/* Contact Section */}
        <div>
          <p className="text-xl font-semibold text-gray-700 mb-4">Get in Touch</p>
          <ul className="space-y-2 text-gray-600">
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">+1-212-456-7890</li>
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">contact@foreveryou.com</li>
            <h4 className="text-md">Delete listing?</h4>
            <li className="hover:text-green-600 transition duration-300 cursor-pointer">Delete</li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-10 border-t border-gray-200 pt-5">
        <p className="text-center text-gray-600 text-sm">
          &copy; 2024 Farmers Mart - All Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;

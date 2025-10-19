import Title from "../components/Title";
import { assets } from "../assets/assets";

function About() {
  return (
    <div className="p-10 bg-gradient-to-b from-green-100 via-blue-50 to-yellow-50">
      <div className="pt-8 text-4xl text-center border-t border-gray-200">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>
      <div className="flex flex-col gap-16 my-10 lg:flex-row">
        <img 
          src={assets.about_img} 
          alt="About us" 
          className="w-full lg:max-w-[500px] rounded-lg shadow-lg" 
        />
        <div className="flex flex-col justify-center w-full gap-6 text-lg text-gray-700 leading-relaxed">
          <p>
            Agri Linker was born out of a passion for agricultural empowerment
            and a desire to revolutionize the way farmers connect with
            consumers. Our journey began with a simple idea: to provide a
            digital platform where farmers can directly sell their produce,
            eliminating intermediaries and ensuring fair compensation.
          </p>
          <p>
            From fresh vegetables and fruits to organic grains and dairy
            products, we offer an extensive collection directly sourced from
            local farmers and agricultural cooperatives, promoting sustainable
            farming practices and rural economic development through Digital
            India’s innovative technological infrastructure.
          </p>
          <b className="text-xl text-gray-800">Our Mission</b>
          <p>
            Our mission at Agri Linker is to empower farmers with digital
            connectivity, market access, and economic opportunity. We’re
            dedicated to providing a transparent platform that connects farmers
            directly to consumers, ensuring fair prices, quality produce, and
            sustainable agricultural practices through the power of Digital
            India’s technological ecosystem.
          </p>
        </div>
      </div>
      <div className="py-4 text-3xl">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>
      <div className="flex flex-col mb-20 gap-10 md:flex-row md:gap-6">
        <div className="flex flex-col gap-4 p-8 bg-white rounded-lg shadow-md md:w-1/3 border-t-4 border-green-500">
          <b className="text-lg text-green-600">Quality Assurance</b>
          <p className="text-base text-gray-600">
            We meticulously select and vet each product to ensure it meets our
            stringent quality standards.
          </p>
        </div>
        <div className="flex flex-col gap-4 p-8 bg-white rounded-lg shadow-md md:w-1/3 border-t-4 border-blue-500">
          <b className="text-lg text-blue-600">Convenience</b>
          <p className="text-base text-gray-600">
            With our user-friendly interface and hassle-free ordering process,
            shopping has never been easier.
          </p>
        </div>
        <div className="flex flex-col gap-4 p-8 bg-white rounded-lg shadow-md md:w-1/3 border-t-4 border-yellow-500">
          <b className="text-lg text-yellow-600">Exceptional Customer Service</b>
          <p className="text-base text-gray-600">
            Our team of dedicated professionals is here to assist you every step of
            the way, ensuring your satisfaction is our top priority.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;

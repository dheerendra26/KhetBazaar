
import { useLang } from "../context/LanguageContext";
const PrivacyPolicy = () => {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-10">

        <h1 className="text-4xl font-bold text-green-700 mb-6 text-center">
          KhetBazaar Privacy Policy & Terms
        </h1>

        <p className="text-gray-600 mb-8 text-center">
          Last Updated: 2026
        </p>

        {/* Privacy Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            1. Privacy Policy
          </h2>

          <p className="text-gray-700 mb-3">
            KhetBazaar respects your privacy. When you register on our platform,
            we collect basic information such as your email address for account
            creation and authentication purposes.
          </p>

          <p className="text-gray-700">
            We do not sell, rent, or share your personal data with third parties
            without your consent except where required by law.
          </p>
        </section>

        {/* Platform Role */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            2. Platform Role
          </h2>

          <p className="text-gray-700">
            KhetBazaar acts only as a digital platform connecting farmers
            (sellers) and customers (buyers). We do not own, produce, store,
            or directly sell agricultural products listed on the platform.
          </p>
        </section>

        {/* Customer Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            3. Customer Policy
          </h2>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              Customers purchase products directly from farmers listed on
              KhetBazaar.
            </li>
            <li>
              Customers must review product details carefully before placing an
              order.
            </li>
            <li>
              If any issue occurs related to product quality, quantity, or
              delivery, it is primarily the responsibility of the farmer.
            </li>
            <li>
              KhetBazaar is not responsible for disputes between the buyer and
              seller regarding product quality or delivery issues.
            </li>
          </ul>
        </section>

        {/* Farmer Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            4. Farmer / Seller Policy
          </h2>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              Farmers are responsible for providing accurate product
              descriptions, pricing, and availability.
            </li>
            <li>
              Farmers must ensure product quality and timely delivery.
            </li>
            <li>
              If a customer raises complaints regarding the product,
              responsibility lies with the farmer.
            </li>
            <li>
              KhetBazaar only provides the platform for listing and connecting
              with customers and is not responsible for product disputes.
            </li>
          </ul>
        </section>

        {/* Payment Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            5. Payment Policy
          </h2>

          <p className="text-gray-700 mb-3">
            Payments made by customers are processed through the platform to
            facilitate transactions between customers and farmers.
          </p>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              Customers must ensure correct payment details before confirming
              orders.
            </li>
            <li>
              Farmers will receive payments according to the platform&apos;s
              transaction process.
            </li>
            <li>
              KhetBazaar is not responsible for payment disputes between buyers
              and sellers once the transaction is completed.
            </li>
          </ul>
        </section>

        {/* Refund Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            6. Return & Refund Policy
          </h2>

          <p className="text-gray-700 font-medium">
            KhetBazaar does not provide refunds or returns for any purchases
            made through the platform.
          </p>

          <p className="text-gray-700 mt-3">
            Customers are advised to carefully review product details before
            making a purchase. Once a transaction is completed, it is considered
            final.
          </p>
        </section>

        {/* Liability Disclaimer */}
        <section>
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            7. Liability Disclaimer
          </h2>

          <p className="text-gray-700">
            KhetBazaar is not liable for any damages, losses, disputes, or
            misunderstandings between farmers and customers. The platform only
            facilitates communication and transactions between the two parties.
          </p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
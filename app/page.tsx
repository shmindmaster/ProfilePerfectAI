import TrainModelZone from "@/components/TrainModelZone";
import { FaImages, FaStar, FaClock, FaShieldAlt } from "react-icons/fa";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section with Upload */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ProfilePerfect AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your photos into professional headshots in minutes. 
            No signup required - try it right now!
          </p>
        </div>

        {/* Main Upload Interface */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <FaImages />
                Create Your Professional Headshots
              </h2>
              <p className="text-blue-100 mt-2">
                Upload 5-10 photos and watch the magic happen
              </p>
            </div>
            <div className="p-8">
              <TrainModelZone packSlug="profileperfect" />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <FaStar className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Quality</h3>
            <p className="text-gray-600">
              Studio-quality headshots perfect for LinkedIn, resumes, and professional profiles
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <FaClock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Get your headshots in minutes, not days. Our AI works while you wait.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <FaShieldAlt className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Identity Preserving</h3>
            <p className="text-gray-600">
              Advanced AI that keeps you looking like you while enhancing your professional image
            </p>
          </div>
        </div>

        {/* Demo Results Preview */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See What You Can Create
            </h2>
            <p className="text-lg text-gray-600">
              Upload your photos above to generate professional headshots like these
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative group">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <FaImages className="h-12 w-12 text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Your Result</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Eye,
  FileText,
  Lock,
  Mail,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Sharing",
    description:
      "Generate secure share links with password protection, expiration dates, and download controls.",
  },
  {
    icon: BarChart3,
    title: "Basic Analytics",
    description:
      "Track views, unique visitors, time spent, and collect viewer emails with simple analytics.",
  },
  {
    icon: Eye,
    title: "View Tracking",
    description:
      "Monitor who views your PDFs, when they view them, and how long they spend reading.",
  },
  {
    icon: Mail,
    title: "Email Capture",
    description:
      "Collect viewer email addresses to build your contact list and follow up with leads.",
  },
  {
    icon: Download,
    title: "Download Control",
    description: "Choose whether viewers can download your PDFs or only view them in the browser.",
  },
  {
    icon: Clock,
    title: "Link Expiration",
    description:
      "Set time-based expiration for your shared links to keep your documents secure.",
  },
  {
    icon: FileText,
    title: "PDF Only",
    description:
      "Currently supports PDF files only. More file types coming soon.",
  },
  {
    icon: Lock,
    title: "Password Protection",
    description:
      "Add password protection to your shared links for extra security.",
  },
  {
    icon: Activity,
    title: "Simple Dashboard",
    description:
      "Easy-to-use dashboard to manage your files, view analytics, and track performance.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            Features
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple features for effective PDF sharing
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Focused on the essentials: secure sharing, basic analytics, and easy management.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 lg:text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            We're working on paid plans with more resources:
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-3">
                <span className="text-sm font-medium text-gray-600">More Storage</span>
              </div>
              <p className="text-sm text-gray-500">5GB, 25GB, and unlimited storage options</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-3">
                <span className="text-sm font-medium text-gray-600">More Files</span>
              </div>
              <p className="text-sm text-gray-500">200+ files and unlimited share links</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-3">
                <span className="text-sm font-medium text-gray-600">Larger Files</span>
              </div>
              <p className="text-sm text-gray-500">50MB and 100MB file size limits</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

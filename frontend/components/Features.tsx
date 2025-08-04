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
      "Generate secure smart links with customizable access controls, expiration dates, and download restrictions.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track viewer behavior, time spent per page, scroll depth, and referrer data with detailed insights.",
  },
  {
    icon: Eye,
    title: "View Tracking",
    description:
      "Monitor who views your PDFs, when they view them, and how long they spend on each page.",
  },
  {
    icon: Mail,
    title: "Email Gating",
    description:
      "Require email addresses to access your documents and build your lead generation pipeline.",
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
      "Set time-based or view-count-based expiration for your shared links for enhanced security.",
  },
  {
    icon: FileText,
    title: "Auto Watermarking",
    description:
      "Automatically add watermarks with viewer information to protect your intellectual property.",
  },
  {
    icon: Lock,
    title: "Privacy Controls",
    description:
      "Full control over who can access your documents with granular permission settings.",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Get instant notifications and real-time analytics on document engagement and viewer activity.",
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
            Everything you need for secure PDF sharing
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Professional-grade features designed for modern document sharing and analytics needs.
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
      </div>
    </section>
  );
}

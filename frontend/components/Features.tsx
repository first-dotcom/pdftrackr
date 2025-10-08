import { BarChart3, Briefcase, CheckCircle, Lock } from "lucide-react";

const featureGroups = [
  {
    icon: Lock,
    title: "Secure Sharing",
    features: [
      {
        title: "Password Protection",
        description: "Add passwords to keep documents secure",
      },
      {
        title: "Email Gating",
        description: "Capture viewer emails before they access",
      },
      {
        title: "Link Expiration",
        description: "Set time limits on document access",
      },
      {
        title: "Download Control",
        description: "Choose if viewers can download or only view",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Simple Analytics",
    features: [
      {
        title: "View Tracking",
        description: "See exactly who viewed your documents and when",
      },
      {
        title: "Page Analytics",
        description: "Track which pages get the most attention",
      },
      {
        title: "Geographic Data",
        description: "Understand where your viewers are located",
      },
      {
        title: "Device Insights",
        description: "See what devices your viewers are using",
      },
    ],
  },
  {
    icon: Briefcase,
    title: "Simple Tools",
    features: [
      {
        title: "Link Management",
        description: "Update or revoke access anytime",
      },
      {
        title: "Virus Scanning",
        description: "Every upload scanned for security",
      },
      {
        title: "30-Day History",
        description: "Access detailed analytics for 30 days",
      },
      {
        title: "Bulk Operations",
        description: "Manage multiple documents at once",
      },
    ],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            Features
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need to Share & Track PDFs
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Simple tools that help you understand how your documents are being used
          </p>
        </div>

        <div className="mt-16 space-y-20">
          {featureGroups.map((group) => (
            <div key={group.title} className="relative">
              {/* Group Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-6">
                  <group.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{group.title}</h3>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {group.features.map((feature) => (
                  <div key={feature.title} className="relative group">
                    <div className="flex items-start p-4 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{feature.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

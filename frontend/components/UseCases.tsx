import { Briefcase, Users, Laptop, GraduationCap } from "lucide-react";

const useCases = [
  {
    title: "Sales Professionals",
    description: "Share proposals and contracts securely with real-time tracking",
    icon: "📊",
  },
  {
    title: "Legal Professionals", 
    description: "Send confidential documents with password protection and audit trails",
    icon: "⚖️",
  },
  {
    title: "HR Departments",
    description: "Distribute employee documents with email capture and analytics",
    icon: "👥",
  },
  {
    title: "Marketing Teams",
    description: "Track engagement on whitepapers and case studies",
    icon: "📈",
  },
  {
    title: "Consultants",
    description: "Deliver reports with professional branding and insights",
    icon: "💼",
  },
  {
    title: "Educators",
    description: "Share course materials with student progress tracking",
    icon: "🎓",
  },
];

export default function UseCases() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            Use Cases
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Perfect For Every Professional
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            See how different professionals use PDFTrackr to share documents smarter
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4 text-2xl">
                  {useCase.icon}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-500">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

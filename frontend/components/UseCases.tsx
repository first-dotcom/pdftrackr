import { Briefcase, Users, Laptop, GraduationCap } from "lucide-react";

const useCases = [
  {
    icon: Briefcase,
    title: "Sales Teams",
    description: "Track proposal engagement and know when prospects are most interested",
    benefits: ["See when clients open proposals", "Track time spent on pricing pages", "Get notified of repeat views"],
  },
  {
    icon: Users,
    title: "HR Departments", 
    description: "Monitor candidate document reviews and streamline hiring",
    benefits: ["Verify candidates reviewed materials", "Track offer letter views", "Ensure policy acknowledgment"],
  },
  {
    icon: Laptop,
    title: "Freelancers",
    description: "Ensure clients read contracts and track project documents",
    benefits: ["Confirm contract reviews", "Share portfolios securely", "Build email lists from viewers"],
  },
  {
    icon: GraduationCap,
    title: "Educators",
    description: "See student engagement with course materials",
    benefits: ["Track reading completion", "Identify struggling students", "Measure material effectiveness"],
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
            See how different teams use PDFTrackr to share documents smarter
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-10">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                  <useCase.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-sm text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

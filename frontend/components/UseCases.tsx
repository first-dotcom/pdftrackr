const useCases = [
  {
    title: "Freelancers",
    description: "Track client proposals and see who's reading your work",
    icon: "💼",
  },
  {
    title: "Consultants",
    description: "Deliver reports with simple branding and insights",
    icon: "📊",
  },
  {
    title: "Small Teams",
    description: "Share documents securely with your team and clients",
    icon: "👥",
  },
  {
    title: "Solopreneurs",
    description: "Understand how your content performs with simple analytics",
    icon: "🚀",
  },
];

export default function UseCases() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Perfect For Every Freelancer
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            See how different freelancers use PDFTrackr to share documents smarter
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-10">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
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

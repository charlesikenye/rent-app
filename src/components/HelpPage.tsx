import { useState } from 'react';
import { 
  Book, 
  Video, 
  MessageCircle, 
  Search, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  questions: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I add a new tenant?',
        answer:
          'Go to the Tenants page and click the "Add Tenant" button. Fill in the tenant information including name, email, phone, unit number, and monthly rent amount.'
      },
      {
        question: 'How do I upload tenant data from Excel?',
        answer:
          'Navigate to the Documents page and use the drag-and-drop upload area. Make sure your Excel file contains columns for Name, Email, Phone, Unit, and Rent Amount.'
      }
    ]
  },
  {
    category: 'Payments',
    questions: [
      {
        question: 'How do I track rent payments?',
        answer:
          'The Payments page shows all rent payments with their status. You can filter by payment status and search for specific tenants or units.'
      },
      {
        question: 'How do I generate receipts?',
        answer:
          'Go to the Receipts page to generate and customize receipts. You can use templates and send receipts directly to tenants via email.'
      }
    ]
  },
  {
    category: 'Reminders',
    questions: [
      {
        question: 'How do I set up automatic rent reminders?',
        answer:
          'Use the Reminders page to create scheduled reminders. You can customize the message and set the frequency for automatic sending.'
      },
      {
        question: 'Can I customize reminder messages?',
        answer:
          'Yes, you can customize all reminder templates in the Reminders page. Use placeholders like {tenant_name} and {rent_amount} for personalization.'
      }
    ]
  }
];

export function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Getting Started']);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredFAQ = faqData
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Help Center</h2>
        <p className="text-gray-600 mt-2">
          Find answers to common questions and learn how to use PropertyPro
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />,
            title: 'User Guide',
            description: 'Comprehensive documentation for all features',
            color: 'blue',
            action: 'Read Guide'
          },
          {
            icon: <Video className="h-12 w-12 text-green-600 mx-auto mb-4" />,
            title: 'Video Tutorials',
            description: 'Step-by-step video guides for key features',
            color: 'green',
            action: 'Watch Videos'
          },
          {
            icon: <MessageCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />,
            title: 'Contact Support',
            description: 'Get help from our support team',
            color: 'orange',
            action: 'Get Support'
          }
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center"
          >
            {item.icon}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.description}</p>
            <button
              className={`bg-${item.color}-600 text-white px-4 py-2 rounded-lg hover:bg-${item.color}-700 transition-colors`}
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>

      {/* Search FAQ */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search frequently asked questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredFAQ.map((category) => (
            <div key={category.category}>
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <h4 className="text-md font-semibold text-gray-900">
                  {category.category}
                </h4>
                {openCategories.includes(category.category) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {openCategories.includes(category.category) && (
                <div className="px-6 pb-4 space-y-4">
                  {category.questions.map((qa, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {qa.question}
                      </h5>
                      <p className="text-gray-600 text-sm">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Overview */}
      {/* (Your original code for Feature Overview + Contact Info is already clean, no change needed) */}
    </div>
  );
}

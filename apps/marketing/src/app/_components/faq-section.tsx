'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@acme/ui/accordion'

const faqs = [
  {
    qa: [
      {
        answer: (
          <span>
            CoFounder AI is a platform designed to help founders automate and
            streamline their fundraising process. We offer features such as
            Investor matchmaking, Data rooms, Automatic Investor Updates, AI
            pitch deck analysis, investment tracking, competitor analysis and
            tracking, and AI-driven market research.
          </span>
        ),
        question: 'What is CoFounder AI?',
      },
      {
        answer: (
          <span>
            Getting started with CoFounder AI is simple. Sign up on our website,
            create your profile, and start exploring our features. Our
            user-friendly interface and comprehensive guides will help you set
            up your fundraising process in no time.
          </span>
        ),
        question: 'How can I get started with CoFounder AI?',
      },
    ],
    section: 'General',
  },
  {
    qa: [
      {
        answer: (
          <span>
            CoFounder AI uses advanced AI algorithms to match your startup with
            the most suitable investors based on your industry, stage, and other
            relevant criteria.
          </span>
        ),
        question: 'How does the Investor matchmaking feature work?',
      },
      {
        answer: (
          <span>
            Our AI analyzes your pitch deck to provide feedback on key areas
            such as structure, content, and overall effectiveness. This helps
            you refine your pitch to better attract investors.
          </span>
        ),
        question: 'What is AI pitch deck analysis?',
      },
    ],
    section: 'Features',
  },
  {
    qa: [
      {
        answer: (
          <span>
            CoFounder AI offers a comprehensive data room feature that allows
            you to securely store and share documents with potential investors.
            You can control access and track who views your documents.
          </span>
        ),
        question: 'What are Data rooms in CoFounder AI?',
      },
      {
        answer: (
          <span>
            Yes, our platform allows you to send automatic updates to your
            investors, keeping them informed about your progress and key
            milestones. This helps maintain investor engagement and
            transparency.
          </span>
        ),
        question: 'Can I send automatic updates to investors?',
      },
    ],
    section: 'Capabilities',
  },

  {
    qa: [
      {
        answer: (
          <span>
            Yes, CoFounder AI allows you to track your investments, monitor
            their performance, and generate reports. This helps you stay
            organized and make informed decisions.
          </span>
        ),
        question: 'Can I track my investments with CoFounder AI?',
      },
    ],
    section: 'Investor Tracking',
  },
  {
    qa: [
      {
        answer: (
          <span>
            Our AI-driven research provides insights into market trends,
            competitor activity, and other relevant data to help you make
            strategic decisions and stay ahead in your industry.
          </span>
        ),
        question: 'What is AI-driven market research?',
      },
    ],
    section: 'Market and Competitor Research',
  },
  {
    qa: [
      {
        answer: (
          <span>
            Yes, CoFounder AI offers a freemium model. You can start using our
            basic features for free. For advanced features and additional
            support, you can upgrade to our premium plans.
          </span>
        ),
        question: 'Does CoFounder AI offer a free plan?',
      },
      {
        answer: (
          <span>
            Our pricing is designed to be flexible and scalable to meet the
            needs of startups at different stages. Visit our pricing page for
            detailed information on our plans and to find the best option for
            your needs.
          </span>
        ),
        question: 'How much does CoFounder AI cost?',
      },
      {
        answer: (
          <span>
            Upgrading to a premium plan unlocks advanced features such as
            enhanced investor matchmaking, detailed analytics, additional
            storage for data rooms, and priority support.
          </span>
        ),
        question: 'What are the benefits of upgrading to a premium plan?',
      },
    ],
    section: 'Pricing',
  },
  {
    qa: [
      {
        answer: (
          <span>
            We provide comprehensive support through our help center, detailed
            documentation, and a dedicated support team. You can also reach out
            to us directly for any specific inquiries.
          </span>
        ),
        question: 'What kind of support does CoFounder AI offer?',
      },
    ],
    section: 'Support',
  },
]
export function FAQSection() {
  return (
    <section id="faq" className="container mx-auto px-4 md:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Need help with something? Here are some of the most common questions
          we get.
        </p>
      </div>
      <div className="mx-auto my-12 flex max-w-(--breakpoint-sm) flex-col gap-12">
        {faqs.map((faq) => (
          <section key={faq.section} id={`faq-${faq.section}`}>
            <h2 className="mb-4 text-left text-base font-semibold tracking-tight text-foreground/60">
              {faq.section}
            </h2>
            <Accordion
              type="single"
              collapsible
              className="flex w-full flex-col items-center justify-center"
            >
              {faq.qa.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="w-full max-w-(--breakpoint-sm)"
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
      <h4 className="mb-12 text-center text-sm font-medium tracking-tight text-foreground/80">
        Still have questions? Email us at{' '}
        <a href="mailto:support@co-founder.ai" className="underline">
          support@co-founder.ai
        </a>
      </h4>
    </section>
  )
}

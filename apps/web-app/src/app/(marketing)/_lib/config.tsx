import { cn } from '@unhook/ui/lib/utils';
import { Globe } from 'lucide-react';
import { FirstBentoAnimation } from '~/app/(marketing)/_components/first-bento-animation';
import { FourthBentoAnimation } from '~/app/(marketing)/_components/fourth-bento-animation';
import { SecondBentoAnimation } from '~/app/(marketing)/_components/second-bento-animation';
import { ThirdBentoAnimation } from '~/app/(marketing)/_components/third-bento-animation';
import { SecurityShieldBackground } from '../_components/security-shield-background';

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'p-1 py-0.5 font-medium dark:font-semibold text-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

// Team pricing constants
export const TEAM_PRICING = {
  BASE_PRICE_MONTHLY: 10,
  BASE_PRICE_YEARLY: 8,
  DEFAULT_SEATS: 1,
  INCLUDED_SEATS: 1,
  MAX_SEATS: 50,
  PRICE_PER_SEAT_MONTHLY: 10,
  PRICE_PER_SEAT_YEARLY: 8,
} as const;

const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const siteConfig = {
  benefits: [
    {
      id: 1,
      image: '/Device-6.png',
      text: 'Test webhooks locally without exposing your development environment.',
    },
    {
      id: 2,
      image: '/Device-7.png',
      text: 'Share webhook URLs across your team while maintaining individual environments.',
    },
    {
      id: 3,
      image: '/Device-8.png',
      text: 'Debug faster with real-time monitoring and payload inspection.',
    },
    {
      id: 4,
      image: '/Device-1.png',
      text: 'Collaborate with your team seamlessly.',
    },
  ],
  bentoSection: {
    description:
      'Test webhooks locally, share URLs with your team, and monitor everything in real-time.',
    items: [
      {
        content: <FirstBentoAnimation />,
        description:
          'Inspect webhook events in real-time. Inspect payloads, headers, and routing information.',
        id: 1,
        title: 'Inspect Webhook Events',
      },
      {
        content: <SecondBentoAnimation />,
        description:
          'Built-in support for major webhook providers like Stripe, GitHub, and Clerk. Easy to extend for custom providers.',
        id: 2,
        title: 'Provider Integrations',
      },
      {
        content: <ThirdBentoAnimation />,
        description:
          'Automatically route webhooks to local development environments based on routing rules.',
        id: 3,
        title: 'Local Event Routing',
      },
      {
        content: <FourthBentoAnimation once={false} />,
        description:
          'Replay webhook events to test your webhooks in different scenarios.',
        id: 4,
        title: 'Replay Webhook Events',
      },
    ],
    title: 'Empower Your Webhook Development',
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        logo: (
          <svg
            aria-label="Stripe Logo"
            className="dark:fill-white fill-black"
            fill="none"
            height="31"
            role="img"
            viewBox="0 0 110 31"
            width="110"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Stripe Logo</title>
            <path d="M34.5469 14.5155C34.5469 19.4338 37.7054 22.8631 42.0822 22.8631C46.4591 22.8631 49.6176 19.4338 49.6176 14.5155C49.6176 9.59721 46.4591 6.16797 42.0822 6.16797C37.7054 6.16797 34.5469 9.59721 34.5469 14.5155ZM46.7298 14.5155C46.7298 18.035 44.8121 20.3137 42.0822 20.3137C39.3524 20.3137 37.4347 18.035 37.4347 14.5155C37.4347 10.996 39.3524 8.71736 42.0822 8.71736C44.8121 8.71736 46.7298 10.996 46.7298 14.5155Z" />
            <path d="M57.7468 22.8652C61.0633 22.8652 62.9584 20.0676 62.9584 16.706C62.9584 13.3444 61.0633 10.5469 57.7468 10.5469C56.2127 10.5469 55.0846 11.156 54.3401 12.0359V10.7725H51.6328V26.678H54.3401V21.3761C55.0846 22.256 56.2127 22.8652 57.7468 22.8652ZM54.2724 16.3676C54.2724 14.1341 55.5359 12.9158 57.2054 12.9158C59.1682 12.9158 60.2285 14.4499 60.2285 16.706C60.2285 18.9621 59.1682 20.4963 57.2054 20.4963C55.5359 20.4963 54.2724 19.2554 54.2724 17.067V16.3676Z" />
            <path d="M70.2843 22.8652C72.6532 22.8652 74.5258 21.6243 75.3605 19.5487L73.0367 18.6688C72.6758 19.8871 71.6154 20.5639 70.2843 20.5639C68.5471 20.5639 67.3288 19.3231 67.1258 17.2926H75.4282V16.3902C75.4282 13.1414 73.6008 10.5469 70.1715 10.5469C66.7422 10.5469 64.5312 13.2316 64.5312 16.706C64.5312 20.3609 66.9002 22.8652 70.2843 22.8652ZM70.1489 12.8255C71.8636 12.8255 72.6758 13.9536 72.6983 15.2621H67.2611C67.6672 13.6603 68.7501 12.8255 70.1489 12.8255Z" />
            <path d="M77.4609 22.617H80.1683V15.6682C80.1683 13.9761 81.4091 13.0737 82.6274 13.0737C84.1164 13.0737 84.703 14.1341 84.703 15.6005V22.617H87.4103V14.8109C87.4103 12.2615 85.9213 10.5469 83.4396 10.5469C81.9054 10.5469 80.8451 11.2463 80.1683 12.0359V10.7725H77.4609V22.617Z" />
            <path d="M95.3397 6.41797L89.2031 22.6167H92.0684L93.4446 18.9167H100.438L101.837 22.6167H104.748L98.611 6.41797H95.3397ZM96.919 9.62163L99.4909 16.3899H94.3921L96.919 9.62163Z" />
            <path d="M109.396 6.46484H106.508V22.6636H109.396V6.46484Z" />
            <path d="M27.9278 12.3665C28.6102 10.3182 28.3752 8.07433 27.2838 6.21115C25.6425 3.35343 22.343 1.88321 19.1205 2.57508C17.687 0.960086 15.6273 0.0416664 13.4681 0.054827C10.1742 0.0473067 7.25158 2.16804 6.2382 5.30213C4.12219 5.73551 2.29568 7.06002 1.22685 8.93727C-0.426682 11.7875 -0.0497272 15.3803 2.15937 17.8244C1.4769 19.8728 1.71191 22.1166 2.8033 23.9798C4.4446 26.8375 7.74416 28.3078 10.9666 27.6159C12.3992 29.2309 14.4598 30.1494 16.6191 30.1352C19.9149 30.1437 22.8384 28.021 23.8518 24.8841C25.9678 24.4508 27.7943 23.1263 28.8631 21.249C30.5148 18.3988 30.137 14.8088 27.9287 12.3646L27.9278 12.3665ZM16.621 28.1696C15.3021 28.1714 14.0246 27.7099 13.0121 26.8648C13.0582 26.8403 13.1381 26.7962 13.1898 26.7642L19.1797 23.3049C19.4862 23.131 19.6742 22.8048 19.6723 22.4522V14.0078L22.2038 15.4696C22.2311 15.4828 22.249 15.5091 22.2527 15.5392V22.5321C22.249 25.6418 19.7306 28.163 16.621 28.1696ZM4.50945 22.9965C3.84863 21.8553 3.61081 20.5176 3.83735 19.2194C3.88154 19.2457 3.95954 19.2937 4.01501 19.3257L10.0049 22.785C10.3086 22.9627 10.6846 22.9627 10.9892 22.785L18.3018 18.5624V21.4859C18.3036 21.5159 18.2895 21.5451 18.266 21.5639L12.2112 25.0599C9.51423 26.6129 6.06995 25.6897 4.51042 22.9965H4.50945ZM2.93302 9.9215C3.59104 8.77841 4.62981 7.90416 5.8669 7.45014C5.8669 7.50182 5.86408 7.59303 5.86408 7.65695V14.5766C5.86218 14.9281 6.05019 15.2543 6.35572 15.4282L13.6683 19.65L11.1368 21.1117C11.1114 21.1287 11.0794 21.1315 11.0512 21.1193L4.99548 17.6204C2.30413 16.0618 1.38101 12.6185 2.93208 9.92243L2.93302 9.9215ZM23.7324 14.7618L16.4198 10.5391L18.9513 9.07829C18.9767 9.06136 19.0087 9.05853 19.0369 9.07077L25.0926 12.5668C27.7887 14.1244 28.7127 17.5734 27.155 20.2695C26.4961 21.4107 25.4583 22.2849 24.2221 22.7399V15.6134C24.2249 15.2619 24.0379 14.9366 23.7333 14.7618H23.7324ZM26.2517 10.9697C26.2075 10.9424 26.1295 10.8954 26.074 10.8634L20.0841 7.40406C19.7804 7.2264 19.4044 7.2264 19.0998 7.40406L11.7873 11.6267V8.70321C11.7854 8.67313 11.7995 8.64398 11.823 8.62518L17.8778 5.13199C20.5748 3.57621 24.0228 4.50217 25.5777 7.20008C26.2347 8.33941 26.4726 9.67333 26.2498 10.9697H26.2517ZM10.411 16.1803L7.87856 14.7185C7.85131 14.7054 7.83347 14.679 7.82971 14.649V7.65599C7.83157 4.54257 10.3575 2.01951 13.4709 2.02139C14.7879 2.02139 16.0626 2.48389 17.075 3.32618C17.0289 3.3506 16.95 3.39479 16.8973 3.42677L10.9074 6.88612C10.6009 7.06002 10.4129 7.38526 10.4148 7.73778L10.411 16.1784V16.1803ZM11.7863 13.2154L15.0436 11.3344L18.3008 13.2145V16.9756L15.0436 18.8556L11.7863 16.9756V13.2154Z" />
          </svg>
        ),
        name: 'Stripe',
      },
      {
        id: 2,
        logo: (
          <svg
            aria-label="GitHub Logo"
            className="dark:fill-white fill-black"
            fill="none"
            height="25"
            role="img"
            viewBox="0 0 113 25"
            width="113"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>GitHub Logo</title>
            <path d="M0.75 2.69908C0.75 1.48458 1.73458 0.5 2.94908 0.5H11.551C12.7655 0.5 13.75 1.48458 13.75 2.69908V4.4005C13.75 5.00775 13.2577 5.50004 12.6505 5.50004H1.84954C1.24229 5.50004 0.75 5.00775 0.75 4.4005V2.69908Z" />
            <path d="M0.75 9.59954C0.75 8.99224 1.24229 8.5 1.84954 8.5H22.551C23.7655 8.5 24.7501 9.48453 24.7501 10.6991V16.4005C24.7501 17.0077 24.2578 17.5 23.6506 17.5H2.94908C1.73458 17.5 0.75 16.5154 0.75 15.3009V9.59954Z" />
            <path d="M11.75 21.5995C11.75 20.9923 12.2423 20.5 12.8495 20.5H23.6505C24.2577 20.5 24.75 20.9923 24.75 21.5995V22.3009C24.75 23.5154 23.7654 24.5 22.5509 24.5H13.9491C12.7346 24.5 11.75 23.5154 11.75 22.3009V21.5995Z" />
            <path d="M38.3455 15.241H40.6572L44.9499 22.2582H50.2059L45.4452 14.7456C48.0872 13.8375 49.628 11.8012 49.628 8.85671C49.628 4.72899 46.7389 2.5 42.0881 2.5H33.75V22.2582H38.3455V15.241ZM38.3455 11.4985V6.38009H41.8404C44.0144 6.38009 45.115 7.31571 45.115 8.93927C45.115 10.5353 44.0144 11.4985 41.8404 11.4985H38.3455Z" />
            <path d="M58.113 22.5607C61.0026 22.5607 63.6446 21.1023 64.7178 18.3229L61.0305 17.1396C60.6177 18.4055 59.5444 19.0659 58.1682 19.0659C56.4896 19.0659 55.3064 17.9377 55.0036 15.9563H64.8278V14.8006C64.8278 10.7002 62.4335 7.45312 58.0309 7.45312C53.8477 7.45312 50.7656 10.7002 50.7656 14.9932C50.7656 19.5062 53.7378 22.5607 58.113 22.5607ZM57.9757 10.8655C59.5991 10.8655 60.4525 11.9662 60.4799 13.2595H55.1413C55.5815 11.6635 56.6274 10.8655 57.9757 10.8655Z" />
            <path d="M67.3281 18.378C67.3281 21.35 68.8967 22.3957 72.0335 22.3957C73.0794 22.3957 73.9051 22.3133 74.6755 22.2031V18.5982C74.1801 18.6532 73.9324 18.6807 73.4097 18.6807C72.309 18.6807 71.6759 18.4606 71.6759 17.2498V11.3884H74.5103V7.75595H71.6759V3.73828H67.3281V7.75595H65.4844V11.3884H67.3281V18.378Z" />
            <path d="M90.4203 15.0207C90.4203 10.5077 87.4212 7.45312 83.1555 7.45312C78.8628 7.45312 75.8906 10.5077 75.8906 15.0207C75.8906 19.5337 78.8628 22.5607 83.1555 22.5607C87.4212 22.5607 90.4203 19.5337 90.4203 15.0207ZM80.2663 15.0207C80.2663 12.489 81.3943 11.0581 83.1555 11.0581C84.9171 11.0581 86.0451 12.489 86.0451 15.0207C86.0451 17.5524 84.9171 18.9833 83.1555 18.9833C81.3943 18.9833 80.2663 17.5524 80.2663 15.0207Z" />
            <path d="M106.28 15.0207C106.28 10.5077 103.281 7.45312 99.0148 7.45312C94.7222 7.45312 91.75 10.5077 91.75 15.0207C91.75 19.5337 94.7222 22.5607 99.0148 22.5607C103.281 22.5607 106.28 19.5337 106.28 15.0207ZM96.1257 15.0207C96.1257 12.489 97.2537 11.0581 99.0148 11.0581C100.776 11.0581 101.904 12.489 101.904 15.0207C101.904 17.5524 100.776 18.9833 99.0148 18.9833C97.2537 18.9833 96.1257 17.5524 96.1257 15.0207Z" />
            <path d="M112.747 2.5H108.344V22.2582H112.747V2.5Z" />
          </svg>
        ),
        name: 'GitHub',
      },
      {
        id: 3,
        logo: (
          <svg
            aria-label="Clerk Logo"
            className="dark:fill-white fill-black"
            fill="none"
            height="31"
            role="img"
            viewBox="0 0 73 31"
            width="73"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Clerk Logo</title>
            <path
              clipRule="evenodd"
              d="M72.2313 15.5944C72.2313 10.4676 69.7478 6.4222 65.0013 6.4222C60.2348 6.4222 57.3508 10.4676 57.3508 15.5543C57.3508 21.5824 60.7558 24.6264 65.6423 24.6264C68.0253 24.6264 69.8278 24.0857 71.1898 23.3247V19.3194C69.8278 20.0003 68.2658 20.4209 66.2833 20.4209C64.3403 20.4209 62.6183 19.74 62.3978 17.3768H72.1913C72.1913 17.1165 72.2313 16.0751 72.2313 15.5944ZM62.3378 13.6919C62.3378 11.4289 63.7198 10.4876 64.9813 10.4876C66.2028 10.4876 67.5048 11.4289 67.5048 13.6919H62.3378ZM49.6203 6.4222C47.6578 6.4222 46.3958 7.3434 45.6948 7.98425L45.4348 6.7426H41.0288V30.0938L46.0353 29.0323L46.0553 23.3648C46.7763 23.8855 47.8378 24.6264 49.6003 24.6264C53.1853 24.6264 56.4498 21.7426 56.4498 15.3941C56.4298 9.5864 53.1253 6.4222 49.6203 6.4222ZM48.4188 20.2206C47.2373 20.2206 46.5363 19.8001 46.0553 19.2794L46.0353 11.8494C46.5563 11.2687 47.2773 10.8681 48.4188 10.8681C50.2413 10.8681 51.5028 12.9108 51.5028 15.5343C51.5028 18.2179 50.2613 20.2206 48.4188 20.2206ZM34.1393 5.2406L39.1663 4.15915V0.09375L34.1393 1.15515V5.2406ZM34.1393 6.76265H39.1663V24.286H34.1393V6.76265ZM28.7518 8.2446L28.4313 6.76265H24.1053V24.286H29.1123V12.4102C30.2938 10.8681 32.2968 11.1485 32.9178 11.3688V6.76265C32.2768 6.5223 29.9333 6.08175 28.7518 8.2446ZM18.7383 2.41685L13.8513 3.45825L13.8313 19.4996C13.8313 22.4636 16.0543 24.6465 19.0188 24.6465C20.6608 24.6465 21.8623 24.3461 22.5233 23.9856V19.9202C21.8823 20.1805 18.7183 21.1017 18.7183 18.1378V11.0284H22.5233V6.76265H18.7183L18.7383 2.41685ZM5.19971 11.8494C5.19971 11.0684 5.84061 10.768 6.90206 10.768C8.42411 10.768 10.3468 11.2286 11.8688 12.0497V7.3434C10.2066 6.68255 8.56431 6.4222 6.90206 6.4222C2.83651 6.4222 0.132812 8.545 0.132812 12.0898C0.132812 17.6171 7.74321 16.736 7.74321 19.1191C7.74321 20.0403 6.94211 20.3407 5.82056 20.3407C4.15831 20.3407 2.03541 19.6598 0.353111 18.7386V23.505C2.21566 24.3061 4.09821 24.6465 5.82056 24.6465C9.98626 24.6465 12.8503 22.5837 12.8503 18.9989C12.8303 13.031 5.19971 14.0924 5.19971 11.8494Z"
              fillRule="evenodd"
            />
          </svg>
        ),
        name: 'Clerk',
      },
    ],
  },
  cta: 'Get Started',
  ctaSection: {
    backgroundImage: '/agent-cta-background.png',
    button: {
      href: '/app/onboarding?utm_source=marketing-site&utm_medium=cta-button',
      text: 'Install Extension Today',
    },
    id: 'cta',
    subtext: 'Start testing webhooks in minutes',
    title: 'Test AI Agent Workflows Locally',
  },
  description: 'Secure webhook testing and development platform.',
  faqSection: {
    description:
      "Answers to common questions about Unhook and its features. If you have any other questions, please don't hesitate to contact us.",
    faQitems: [
      {
        answer:
          'Unhook is a modern webhook development platform that enables teams to test webhooks locally while sharing URLs across the team. It provides real-time monitoring, payload inspection, and team collaboration features to streamline the webhook testing process.',
        id: 1,
        question: 'What is Unhook?',
      },
      {
        answer:
          'Unhook works by creating shareable webhook URLs that route to your local development environment. Team members can then test these webhooks by sending requests to these URLs. Unhook provides a web dashboard for real-time monitoring and payload inspection, allowing you to see who is accessing your webhooks and what data is being sent.',
        id: 2,
        question: 'How does Unhook work?',
      },
      {
        answer:
          'Yes, Unhook uses end-to-end encryption for all webhook traffic. We do not store webhook payload data permanently, and all data is encrypted in transit. Your API keys and sensitive information are protected with industry-standard security measures.',
        id: 3,
        question: 'Is my data secure?',
      },
      {
        answer:
          'Simply click on any webhook event in the Unhook sidebar, then use the "Replay Event" button. The extension will resend the webhook to your local development server, making it easy to test and debug.',
        id: 4,
        question: 'How do I replay webhook events from VS Code?',
      },
      {
        answer:
          'Yes, the VS Code extension is completely free to use. You can view webhook events, replay requests, and collaborate with your team at no cost. Premium features like advanced analytics are available with paid plans.',
        id: 5,
        question: 'Is the extension free to use?',
      },
      {
        answer:
          'Unhook is perfect for testing webhooks triggered by AI agents using MCP (Model Context Protocol) servers. When your AI agent calls an MCP tool that triggers a webhook, Unhook captures it for inspection and replay. This helps you debug AI workflows and validate that your agentic systems are working correctly.',
        id: 6,
        question: 'How can I test AI calls with MCP servers?',
      },
      {
        answer:
          'MCP (Model Context Protocol) is a standard for connecting AI models to external data sources and tools. Many MCP servers trigger webhooks when AI agents perform actions. Unhook helps you test these AI-triggered webhooks, making it easier to debug agentic systems and validate AI-driven automations.',
        id: 7,
        question: 'What is MCP and how does it relate to webhook testing?',
      },
      {
        answer:
          'Yes! Unhook provides one shared webhook URL that your entire team can use across all services like Stripe, GitHub, and Clerk. The same URL intelligently routes webhooks to the active developer, eliminating the need for individual URLs.',
        id: 8,
        question: 'Can my entire team use the same webhook URL?',
      },
      {
        answer:
          'Create an unhook.config.json file in your repository with your shared webhook URLs. When team members check out the code, they automatically get access to the same webhook configuration. No more manual URL sharing or setup for new team members.',
        id: 9,
        question: 'How do I share webhook configuration with my team?',
      },
    ],
    title: 'Frequently Asked Questions',
  },
  featureSection: {
    description:
      'Discover how Unhook transforms webhook testing in four easy steps',
    items: [
      {
        content:
          'Real-time monitoring through our web dashboard for webhook inspection and debugging.',
        id: 1,
        image: '/screenshots/vscode-marketplace.png',
        title: 'VS Code Extension',
      },
      {
        content:
          'Create shareable webhook URLs that route to your local environment. Perfect for team collaboration.',
        id: 2,
        image: '/screenshots/architecture.png',
        title: 'JetBrains Plugin (coming soon)',
      },
      {
        content:
          'Share webhook URLs across your team while maintaining individual developer environments.',
        id: 3,
        image: '/screenshots/mcp-docs.png',
        title: 'MCP Server',
      },
      {
        content:
          'Create shareable webhook URLs that route to your local environment. Perfect for team collaboration.',
        id: 4,
        image: '/screenshots/cli-light.png',
        title: 'Unhook CLI',
      },

      // {
      //   component: <UnhookConfigDemo />,
      //   content:
      //     "Webhooks are securely routed to the appropriate developer's machine based on active sessions.",
      //   id: 2,
      //   title: 'Individual Repo Configuration',
      // },
    ],
    title: 'Simple. Secure. Collaborative.',
  },
  footerLinks: [
    {
      links: [
        { id: 1, title: 'Privacy Policy', url: '/privacy-policy' },
        { id: 2, title: 'Terms of Service', url: '/terms-of-service' },
      ],
      title: 'Company',
    },
    {
      links: [
        {
          id: 12,
          title: 'VS Code Extension',
          url: 'https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode',
        },
        {
          id: 13,
          title: 'JetBrains Plugin',
          url: 'https://plugins.jetbrains.com/plugin/24002-unhook',
        },
        {
          id: 14,
          title: 'MCP Server',
          url: 'https://docs.unhook.sh/mcp-integration',
        },
        {
          id: 15,
          title: 'Unhook CLI',
          url: 'https://www.npmjs.com/package/@unhook/cli',
        },
      ],
      title: 'Products',
    },
    {
      links: [
        {
          id: 16,
          title: 'Changelog',
          url: 'https://github.com/unhook-sh/unhook/releases',
        },
        // { id: 17, title: 'Blog', url: '/blog' },
        { id: 18, title: 'Docs', url: 'https://docs.unhook.sh' },
        { id: 19, title: 'OSS Friends', url: '/oss-friends' },
        { id: 20, title: 'Glossary', url: '/glossary' },
      ],
      title: 'Resources',
    },
    {
      links: [
        { id: 3, title: 'All Comparisons', url: '/comparisons' },
        { id: 4, title: 'vs ngrok', url: '/comparisons#ngrok' },
        { id: 5, title: 'vs Webhook.site', url: '/comparisons#webhook-site' },
        { id: 6, title: 'vs Beeceptor', url: '/comparisons#beeceptor' },
        { id: 7, title: 'vs Localtunnel', url: '/comparisons#localtunnel' },
        { id: 8, title: 'vs Smee.io', url: '/comparisons#smee' },
        {
          id: 9,
          title: 'vs Cloudflare Tunnel',
          url: '/comparisons#cloudflare-tunnel',
        },
        { id: 10, title: 'vs Hookdeck', url: '/comparisons#hookdeck' },
        { id: 11, title: 'vs Svix', url: '/comparisons#svix' },
      ],
      title: 'Compare',
    },

    // {
    //   title: 'Products',
    //   links: [
    //     { id: 5, title: 'Company', url: '#' },
    //     { id: 6, title: 'Product', url: '#' },
    //     { id: 7, title: 'Press', url: '#' },
    //     { id: 8, title: 'More', url: '#' },
    //   ],
    // },
    // {
    //   title: 'Resources',
    //   links: [
    //     { id: 9, title: 'Press', url: '#' },
    //     { id: 10, title: 'Careers', url: '#' },
    //     { id: 11, title: 'Newsletters', url: '#' },
    //     { id: 12, title: 'More', url: '#' },
    //   ],
    // },
  ],
  growthSection: {
    description:
      'Where advanced security meets team collaboration—designed to protect your webhooks and empower your development.',
    items: [
      {
        content: <SecurityShieldBackground />,
        description:
          'Debug webhooks without leaving your editor. Keep your focus on code while monitoring webhook events in real-time.',
        id: 1,
        title: 'Seamless Workflow Integration',
      },
      {
        content: (
          <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_50%)] -translate-y-20">
            <Globe className="top-28" />
          </div>
        ),
        description:
          'Works with VS Code, JetBrains IDEs, Cursor, and other editors. Compatible with all major webhook providers and development environments.',
        id: 2,
        title: 'Universal Compatibility',
      },
    ],
    title: 'Built for Secure Development',
  },
  hero: {
    badge: 'Free During Beta',
    badgeIcon: <span>🔥</span>,
    badgeUrl:
      // 'https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode',
      'https://unhook.sh/app/onboarding?utm_source=marketing-site&utm_medium=hero-cta',
    cta: {
      primary: {
        href: '/app/onboarding?utm_source=marketing-site&utm_medium=hero-cta',
        text: 'Install Extension',
      },
      secondary: {
        href: 'https://docs.unhook.sh',
        text: 'View Docs',
      },
    },
    description:
      'Open source toolkit for webhook development. Install the extension in your editor to test, debug, and monitor webhooks with your team - all from your local environment.',
    title: 'AI-Powered Webhook Development',
  },
  keywords: [
    'Webhook Testing',
    'Local Development',
    'Team Collaboration',
    'API Testing',
  ],
  links: {
    discord: 'https://discord.gg/unhooksh',
    email: 'chris.watts.t@gmail.com',
    github: 'https://github.com/unhook-sh',
    twitter: 'https://twitter.com/unhooksh',
  },
  name: 'Unhook',
  nav: {
    links: [
      { href: '#hero', id: 1, name: 'Home' },
      {
        href: 'https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode',
        id: 3,
        name: 'VS Code Extension',
      },
      {
        href: 'https://plugins.jetbrains.com/plugin/24002-unhook',
        id: 4,
        name: 'JetBrains Plugin',
      },
      {
        href: 'https://docs.unhook.sh/mcp-integration',
        id: 5,
        name: 'MCP Server',
      },
      {
        href: 'https://www.npmjs.com/package/@unhook/cli',
        id: 6,
        name: 'Unhook CLI',
      },
      // { id: 5, name: 'Features', href: '#features' },
      // { id: 6, name: 'Pricing', href: '#pricing' },
    ],
  },
  pricing: {
    description:
      'Start for free and upgrade as your team grows. No credit card required.',
    pricingItems: [
      {
        buttonColor: 'bg-accent text-primary',
        buttonText: 'Install Extension',
        description: 'Perfect for individual developers',
        features: [
          'CLI & Editor extension access',
          '50 webhook events per day',
          '1 webhook URL',
          'Basic webhook monitoring',
          'Local event routing',
          'Single developer',
          'Public webhook URLs',
          'Community support',
        ],
        href: '/app/onboarding?utm_source=marketing-site&utm_medium=pricing-cta-free',
        isPopular: false,
        name: 'Free',
        period: 'month',
        price: '$0',
        yearlyPrice: '$0',
      },
      {
        betaFree: false,
        buttonColor: 'bg-secondary text-white',
        buttonText: 'Start Trial',
        description: 'Ideal for development teams',
        features: [
          'AI-Powered debugging with MCP Server',
          'Trace AI Agent Workflows',
          'Unlimited webhook events',
          'Unlimited webhook URLs',
          'Team webhook sharing',
          'Unlimited developers',
          'Private webhook URLs',
          'Custom webhook transformations',
          'Custom webhook subdomains',
          'Advanced monitoring & analytics',
          'Route to external integrations',
          // 'Advanced monitoring',
          // 'Usage analytics',
          // 'Route to external integrations',
          // 'Priority support',
        ],
        href: '/app/onboarding?utm_source=marketing-site&utm_medium=pricing-cta-team',
        isPopular: true,
        name: 'Team',
        period: 'month',
        price: '$30',
        yearlyPrice: '$24',
      },
      {
        buttonColor: 'bg-primary text-primary-foreground',
        buttonText: 'Schedule a call',
        description: 'For large organizations with custom needs',
        features: [
          'On-premise deployment',
          'SSO & SAML integration',
          'Custom API rate limits',
          'Audit logs & compliance',
          '99.9% uptime SLA',
          'Dedicated account manager',
          'Priority support',
          'Custom training & onboarding',
        ],
        href: 'https://cal.com/seawatts/30min',
        isPopular: false,
        name: 'Enterprise',
        period: 'month',
        price: 'Custom',
        yearlyPrice: 'Custom',
      },
    ],
    title: 'Simple, transparent pricing',
  },
  quoteSection: {
    author: {
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Sarah Chen',
      role: 'Lead Developer, TechFlow',
    },
    quote:
      'Unhook has transformed our webhook development process. What used to be a complex coordination effort is now seamless collaboration.',
  },
  testimonials: [
    {
      description: (
        <p>
          The AI-driven analytics from #QuantumInsights have revolutionized our
          product development cycle.
          <Highlight>
            Insights are now more accurate and faster than ever.
          </Highlight>{' '}
          A game-changer for tech companies.
        </p>
      ),
      id: '1',
      img: 'https://randomuser.me/api/portraits/men/91.jpg',
      name: 'Alex Rivera',
      role: 'CTO at InnovateTech',
    },
    {
      description: (
        <p>
          Implementing #AIStream&apos;s customer prediction model has
          drastically improved our targeting strategy.
          <Highlight>Seeing a 50% increase in conversion rates!</Highlight>{' '}
          Highly recommend their solutions.
        </p>
      ),
      id: '2',
      img: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Samantha Lee',
      role: 'Marketing Director at NextGen Solutions',
    },
    {
      description: (
        <p>
          As a startup, we need to move fast and stay ahead. #CodeAI&apos;s
          automated coding assistant helps us do just that.
          <Highlight>Our development speed has doubled.</Highlight> Essential
          tool for any startup.
        </p>
      ),
      id: '3',
      img: 'https://randomuser.me/api/portraits/men/45.jpg',
      name: 'Raj Patel',
      role: 'Founder & CEO at StartUp Grid',
    },
    {
      description: (
        <p>
          #VoiceGen&apos;s AI-driven voice synthesis has made creating global
          products a breeze.
          <Highlight>Localization is now seamless and efficient.</Highlight> A
          must-have for global product teams.
        </p>
      ),
      id: '4',
      img: 'https://randomuser.me/api/portraits/women/83.jpg',
      name: 'Emily Chen',
      role: 'Product Manager at Digital Wave',
    },
    {
      description: (
        <p>
          Leveraging #DataCrunch&apos;s AI for our financial models has given us
          an edge in predictive accuracy.
          <Highlight>
            Our investment strategies are now powered by real-time data
            analytics.
          </Highlight>{' '}
          Transformative for the finance industry.
        </p>
      ),
      id: '5',
      img: 'https://randomuser.me/api/portraits/men/1.jpg',
      name: 'Michael Brown',
      role: 'Data Scientist at FinTech Innovations',
    },
    {
      description: (
        <p>
          #LogiTech&apos;s supply chain optimization tools have drastically
          reduced our operational costs.
          <Highlight>
            Efficiency and accuracy in logistics have never been better.
          </Highlight>{' '}
        </p>
      ),
      id: '6',
      img: 'https://randomuser.me/api/portraits/women/5.jpg',
      name: 'Linda Wu',
      role: 'VP of Operations at LogiChain Solutions',
    },
    {
      description: (
        <p>
          By integrating #GreenTech&apos;s sustainable energy solutions,
          we&apos;ve seen a significant reduction in carbon footprint.
          <Highlight>
            Leading the way in eco-friendly business practices.
          </Highlight>{' '}
          Pioneering change in the industry.
        </p>
      ),
      id: '7',
      img: 'https://randomuser.me/api/portraits/men/14.jpg',
      name: 'Carlos Gomez',
      role: 'Head of R&D at EcoInnovate',
    },
    {
      description: (
        <p>
          #TrendSetter&apos;s market analysis AI has transformed how we approach
          fashion trends.
          <Highlight>
            Our campaigns are now data-driven with higher customer engagement.
          </Highlight>{' '}
          Revolutionizing fashion marketing.
        </p>
      ),
      id: '8',
      img: 'https://randomuser.me/api/portraits/women/56.jpg',
      name: 'Aisha Khan',
      role: 'Chief Marketing Officer at Fashion Forward',
    },
    {
      description: (
        <p>
          Implementing #MediCareAI in our patient care systems has improved
          patient outcomes significantly.
          <Highlight>
            Technology and healthcare working hand in hand for better health.
          </Highlight>{' '}
          A milestone in medical technology.
        </p>
      ),
      id: '9',
      img: 'https://randomuser.me/api/portraits/men/18.jpg',
      name: 'Tom Chen',
      role: 'Director of IT at HealthTech Solutions',
    },
    {
      description: (
        <p>
          #LearnSmart&apos;s AI-driven personalized learning plans have doubled
          student performance metrics.
          <Highlight>
            Education tailored to every learner&apos;s needs.
          </Highlight>{' '}
          Transforming the educational landscape.
        </p>
      ),
      id: '10',
      img: 'https://randomuser.me/api/portraits/women/73.jpg',
      name: 'Sofia Patel',
      role: 'CEO at EduTech Innovations',
    },
    {
      description: (
        <p>
          With #CyberShield&apos;s AI-powered security systems, our data
          protection levels are unmatched.
          <Highlight>Ensuring safety and trust in digital spaces.</Highlight>{' '}
          Redefining cybersecurity standards.
        </p>
      ),
      id: '11',
      img: 'https://randomuser.me/api/portraits/men/25.jpg',
      name: 'Jake Morrison',
      role: 'CTO at SecureNet Tech',
    },
    {
      description: (
        <p>
          #DesignPro&apos;s AI has streamlined our creative process, enhancing
          productivity and innovation.
          <Highlight>Bringing creativity and technology together.</Highlight> A
          game-changer for creative industries.
        </p>
      ),
      id: '12',
      img: 'https://randomuser.me/api/portraits/women/78.jpg',
      name: 'Nadia Ali',
      role: 'Product Manager at Creative Solutions',
    },
    {
      description: (
        <p>
          #VentureAI&apos;s insights into startup ecosystems have been
          invaluable for our growth and funding strategies.
          <Highlight>Empowering startups with data-driven decisions.</Highlight>{' '}
          A catalyst for startup success.
        </p>
      ),
      id: '13',
      img: 'https://randomuser.me/api/portraits/men/54.jpg',
      name: 'Omar Farooq',
      role: 'Founder at Startup Hub',
    },
  ],
  url,
};

export type SiteConfig = typeof siteConfig;

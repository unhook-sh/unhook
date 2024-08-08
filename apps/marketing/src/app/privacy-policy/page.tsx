import { SphereMask } from "@acme/ui/magicui/sphere-mask";

import { CallToActionSection } from "../_components/cta-section";

export default function Page() {
  return (
    <main className="mx-auto flex flex-1 flex-col gap-64 overflow-hidden">
      <div className="relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8">
        <h1 className="text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent [--animation-delay:200ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
          Privacy Policy
        </h1>
        <SphereMask />
        <section className="container mt-24 flex max-w-5xl flex-col gap-8 text-left">
          <div>
            <h2 className="mb-1 mt-5 text-xl">CoFounder, Inc.</h2>
            <h2 className="mb-4">Privacy Policy</h2>
            <p>
              <strong>Effective Date: May 15, 2024</strong>
            </p>
          </div>
          <p>
            This Privacy Policy applies to Personal Data (defined below)
            processed by CoFounder Inc (“CoFounder,” “we,” “us,” or “our”) in
            the course of providing our SaaS based developer tool for building
            AI functionality into software products, as collected from our
            website (the “Site”), our web applications (the “Apps”), and our
            related online service offerings (collectively with the “Site” and
            the “Apps”, the “Services”).
          </p>
          <p>
            This Privacy Policy explains what Personal Data we collect, how we
            use and share that data, and your choices concerning our data
            practices. It also explains how we engage with Stripe to provide the
            Service to you.
          </p>
          <p>
            Before using the Service or submitting any Personal Data to us,
            please review this Privacy Policy carefully and contact us at
            privacy@co-founder.ai if you have any questions. By using the
            Service, you agree to the practices described in this Privacy
            Policy. If you do not agree to this Privacy Policy, you may not
            access or use the Service.
          </p>

          <h4>1. PERSONAL DATA WE COLLECT</h4>
          <p>
            We collect information that alone or in combination with other
            information in our possession personally identifies you (“Personal
            Data”) as follows:
          </p>
          <p>
            <strong>Personal Data You Provide:</strong> We collect Personal Data
            when you visit the Site or Apps, register to use the Service, in
            connection with your use of the Service, and in other instances
            where you may provide it to us. The Personal Data collected during
            these interactions may vary based on what you choose to share with
            us, but it will generally include your name, email address, and
            mobile phone number.
          </p>
          <p>
            <strong>Account Information:</strong> When you create an account
            with us, we will collect information associated with your account,
            including your name, contact information, account credentials,
            payment card information, and transaction history, (collectively,
            “Account Information”).
          </p>
          <p>
            <strong>User Content:</strong> When you use our Services, we collect
            Personal Data that is included in the input, file uploads, or
            feedback that you provide to our Services (“Content”). We cannot
            control what Content you share with us.
          </p>
          <p>
            <strong>Communication Information:</strong> If you communicate with
            us, we collect your name, contact information, and the contents of
            any messages you send (“Communication Information”).
          </p>
          <p>
            We will also collect certain payment and financial information in
            connection with the Service, including as necessary to ensure
            payments can be processed by our third-party payment processors,
            such as Stripe, Inc. (“Stripe”). Accordingly, in addition to this
            Privacy Policy and our Terms of Service, information related to your
            purchases is also processed according to Stripe’s Services Agreement
            and Privacy Policy.
          </p>
          <p>
            <strong>
              Personal Data We Receive Automatically From Your Use of the
              Service:
            </strong>{" "}
            When you visit, use and interact with the Service, we may receive
            certain information about your visit, use or interactions. For
            example, we may monitor the number of people that visit the Service,
            peak hours of visits, which page(s) are visited, the domains our
            visitors come from (e.g., google.com, yahoo.com, etc.), and which
            browsers people use to access the Service (e.g., Google Chrome,
            Microsoft Internet Explorer, etc.), and geographical location
            information. In particular, the following information may be created
            and automatically logged in our systems:
          </p>
          <p>
            <strong>Log data:</strong> Information that your browser
            automatically sends whenever you visit the Service (“Log Data”). Log
            Data includes your Internet Protocol address, browser type and
            settings, the date and time of your request, and how you interacted
            with the Service.
          </p>
          <p>
            <strong>Cookies:</strong> Please see the “Cookies” section below to
            learn more about how we use cookies.
          </p>
          <p>
            <strong>Device information:</strong> Includes name of the device,
            operating system, and browser you are using. Information collected
            may depend on the type of device you use and its settings.
          </p>
          <p>
            <strong>Usage Information:</strong> We collect information about how
            you use our Service, such as the types of content that you view or
            engage with, the features you use, the actions you take, and the
            time, frequency and duration of your activities.
          </p>
          <p>
            <strong>Cookies:</strong> We use cookies to operate and administer
            our Service, gather usage data on our Service and improve your
            experience on it. A “cookie” is a piece of information sent to your
            browser by a website you visit. Cookies can be stored on your
            computer for different periods of time. Some cookies expire after a
            certain amount of time, or upon logging out (session cookies),
            others survive after your browser is closed until a defined
            expiration date set in the cookie (as determined by the third party
            placing it), and help recognize your computer when you open your
            browser and browse the Internet again (persistent cookies). For more
            details on cookies please visit All About Cookies.
          </p>
          <p>
            <strong>Analytics:</strong> We may use certain third-party analytics
            providers, including Google Analytics, a web analytics service
            provided by Google, Inc. (“Google”). Google Analytics uses cookies
            to help us analyze how users use the Service and enhance your
            experience when you use the Service. For more information on how
            Google uses this data, go to
            www.google.com/policies/privacy/partners/.
          </p>
          <p>
            <strong>Online Tracking and Do Not Track Signals:</strong> We and
            our third-party service providers, including Google, Facebook, and
            Instagram, may use cookies, pixels or other tracking technologies to
            collect information about your browsing activities over time and
            across different websites following your use of the Service and use
            that information to send targeted advertisements. Our Service
            currently does not respond to “Do Not Track” (“DNT”) signals and
            operates as described in this Privacy Policy whether or not a DNT
            signal is received. If we do respond to DNT signals in the future,
            we will update this Privacy Policy to describe how we do so.
          </p>
          <p>
            <strong>Your Choices.</strong> On most web browsers, you will find a
            “help” section on the toolbar. Please refer to this section for
            information on how to receive a notification when you are receiving
            a new cookie and how to turn cookies off. Please see the links below
            for guidance on how to modify your web browser’s settings on the
            most popular browsers:
          </p>
          <ul>
            <li>Microsoft Edge</li>
            <li>Mozilla Firefox</li>
            <li>Google Chrome</li>
            <li>Apple Safari</li>
          </ul>
          <p>
            Please note that if you limit the ability of websites to set
            cookies, you may be unable to access certain parts of the Service
            and you may not be able to benefit from the full functionality of
            the Service.
          </p>
          <p>
            Advertising networks may collect Personal Data through the use of
            cookies. Most advertising networks offer you a way to opt out of
            targeted advertising. If you would like to find out more
            information, please visit the Network Advertising Initiative’s
            online resources at{" "}
            <a href="http://www.networkadvertising.org" target="_blank">
              http://www.networkadvertising.org
            </a>{" "}
            and follow the opt-out instructions there.
          </p>
          <p>
            If you access the Service on your mobile device, you may not be able
            to control tracking technologies through the settings.
          </p>

          <h4>2. HOW WE USE PERSONAL DATA</h4>
          <p>We may use Personal Data for the following purposes:</p>
          <ul>
            <li>
              To provide and facilitate your engagement with the Service,
              including to store and analyze data to enable more powerful
              searching; log interactions; support, process and fulfill your
              purchase of services made available on the Service;
            </li>
            <li>
              To respond to your inquiries, comments, feedback or questions;
            </li>
            <li>
              To send administrative information to you, for example,
              information regarding the Service, and changes to our terms,
              conditions, and policies;
            </li>
            <li>
              To administer a promotion, contest, sweepstakes, survey or other
              Service feature;
            </li>
            <li>To analyze how you interact with our Service;</li>
            <li>
              To maintain and improve the content and functionality of the
              Service;
            </li>
            <li>To develop new products and services;</li>
            <li>
              To prevent fraud, criminal activity, or misuses of our Service,
              and to ensure the security of our IT systems, architecture and
              networks; and
            </li>
            <li>
              To comply with legal obligations and legal process and to protect
              our rights, privacy, safety or property, and/or that of our
              affiliates, you or other third parties.
            </li>
          </ul>
          <p>
            <strong>Aggregated or Anonymized Information.</strong> We may
            collect or generate aggregated and/or anonymized Personal Data and
            use the aggregated and/or anonymized information to analyze the
            effectiveness of our Service, to improve and add features to our
            Service, and for any other lawful purpose. In addition, we may share
            aggregated and/or anonymized information with our business partners
            and other third parties. We may collect or generate aggregated
            and/or anonymized information through the Service, through cookies,
            and through other means described in this Privacy Policy.
          </p>
          <p>
            <strong>Marketing.</strong> We may use your Personal Data to contact
            you to tell you about products or services we believe may be of
            interest to you. For instance, if you provide your email or
            telephone number, we may use that information to send you special
            offers. You may opt out of receiving emails by following the
            instructions contained in each promotional email we send you. In
            addition, if at any time you do not wish to receive future marketing
            communications, you may contact us at privacy@co-founder.ai. If you
            unsubscribe from our marketing lists you will no longer receive
            marketing communications, but we will continue to contact you
            regarding management of your account, other administrative matters,
            and to respond to your requests.
          </p>

          <h4>3. SHARING AND DISCLOSURE OF PERSONAL DATA</h4>
          <p>
            In certain circumstances we may share your Personal Data with third
            parties without further notice to you, unless required by the law,
            as set forth below:
          </p>
          <p>
            <strong>Vendors and Service Providers:</strong> To assist us in
            meeting business operations needs and to perform certain services
            and functions, we may share Personal Data with vendors and service
            providers, including providers of data analytics services, hosting
            services, cloud services, authentication services, and other
            information technology services providers, email communication
            software and email newsletter services, advertising and marketing
            services, financial services providers and payment processors
            (including Stripe), customer relationship management and customer
            support services, and web analytics services (for more details on
            the third parties that place cookies through the Service, please see
            the “Cookies” section above). Pursuant to our instructions, these
            parties will access, process or store Personal Data in the course of
            performing their duties to us. We take commercially reasonable steps
            to ensure our service providers adhere to the security standards we
            apply to your Personal Data, and to limit their use and other
            processing of your Personal Data to the performance of their
            services for us.
          </p>
          <p>
            <strong>Business Transfers:</strong> If we are involved in a merger,
            acquisition, financing due diligence, reorganization, bankruptcy,
            receivership, sale of all or a portion of our assets, or transition
            of service to another provider, your Personal Data and other
            information may be shared in the diligence process with
            counterparties and others assisting with the transaction and
            transferred to a successor or affiliate as part of that transaction
            along with other assets.
          </p>
          <p>
            <strong>Legal Requirements:</strong> If required to do so by law or
            in the good faith belief that such action is necessary to (i) comply
            with a legal obligation, including to meet national security or law
            enforcement requirements, (ii) protect and defend our rights or
            property, (iii) prevent fraud, (iv) act in urgent circumstances to
            protect the personal safety of users of the Service, or the public,
            or (v) protect against legal liability.
          </p>
          <p>
            <strong>Affiliates:</strong> We may share Personal Data with our
            affiliates, meaning an entity that controls, is controlled by, or is
            under common control with CoFounder. Our affiliates may use the
            Personal Data we share in a manner consistent with this Privacy
            Policy.
          </p>

          <h4>4. DATA RETENTION</h4>
          <p>
            We keep Personal Data for as long as you use the Service or as
            reasonably necessary or advisable to fulfill the purpose(s) for
            which it was collected, provide the Service, resolve disputes,
            establish legal defenses, conduct audits, pursue legitimate business
            purposes, protect against fraud, enforce our agreements, and comply
            with applicable laws.
          </p>

          <h4>5. UPDATE YOUR INFORMATION</h4>
          <p>
            Please log in to your account or contact us at support@co-founder.ai
            if you need to change or correct your Personal Data.
          </p>

          <h4>6. CHILDREN</h4>
          <p>
            Our Service is not directed to children who are under the age of 18.
            CoFounder does not knowingly collect Personal Data from children
            under the age of 16. If you have reason to believe that a child
            under the age of 16 has provided Personal Data to us through the
            Service please contact us at privacy@co-founder.ai. and we will
            endeavor to delete that information from our databases.
          </p>

          <h4>7. LINKS TO OTHER WEBSITES AND THIRD PARTY FUNCTIONALITY</h4>
          <p>
            The Service may contain links to other websites or applications, or
            other functionality not operated or controlled by CoFounder
            (“Third-Party Services”). You will generally have discretion and
            control over the Third-Party Services with whom you elect to
            interact and share your Personal Data, except as otherwise provided
            in this Privacy Policy. These Third-Party Services include certain
            payment processors or other API finance solutions, such as Stripe.
            The information that you share with Third-Party Services will be
            governed by the specific privacy policies and terms of service of
            the Third-Party Services and not by this Privacy Policy. By
            providing these links or functionality we do not imply that we
            endorse or have reviewed these services. Please contact the
            Third-Party Services directly for information on their privacy
            practices and policies.
          </p>

          <h4>8. SECURITY</h4>
          <p>
            You use the Service at your own risk. We implement commercially
            reasonable technical, administrative, and organizational measures
            designed to protect Personal Data both online and offline from loss,
            misuse, and unauthorized access, disclosure, alteration or
            destruction. However, no Internet or e-mail transmission is ever
            fully secure or error free. In particular, e-mail sent to or from us
            may not be secure. Therefore, you should take special care in
            deciding what information you send to us via the Service or e-mail.
            Please keep this in mind when disclosing any Personal Data to us via
            the Internet. In addition, we are not responsible for circumvention
            of any privacy settings or security measures contained on the
            Service, or third-party websites.
          </p>

          <h4>9. YOUR CHOICES</h4>
          <p>
            In certain circumstances providing Personal Data is optional.
            However, if you choose not to provide Personal Data that is needed
            to use some features of our Service, you may be unable to use those
            features. You can also contact us at support@co-founder.ai to ask us
            to update or correct your Personal Data.
          </p>

          <h4>10. INTERNATIONAL DATA TRANSFERS</h4>
          <p>
            All information processed by us may be transferred, processed, and
            stored anywhere in the world, including but not limited to, the
            United States and other countries. If you are accessing our Service
            from the European Economic Area (“EEA”) or other regions with laws
            governing data collection and use, please note that your Personal
            Data will be transferred to and stored in the United States as
            necessary for the purposes described in this Privacy Policy, and
            Personal Data may be transmitted to our service providers supporting
            our business operations (described above). The United States may
            have data protection laws less stringent than or otherwise different
            from the laws in effect in the country in which you are located.
            Where we transfer your Personal Data out of the EEA or the United
            Kingdom we will take steps designed to ensure that your Personal
            Data receives an adequate level of security protection where it is
            processed and that your rights continue to be protected.
          </p>

          <h4>11. CHANGES TO THE PRIVACY POLICY</h4>
          <p>
            The Service, and our business may change from time to time. As a
            result, we may change this Privacy Policy at any time. When we do,
            we will post an updated version on this page, unless another type of
            notice is required by the applicable law. By continuing to use our
            Service or providing us with Personal Data after we have posted an
            updated Privacy Policy, or notified you by other means if
            applicable, you consent to the revised Privacy Policy and practices
            described in it.
          </p>

          <h4>12. CONTACT US</h4>
          <p>
            If you have any questions about our Privacy Policy or information
            practices, please feel free to contact us at privacy@co-founder.ai.
          </p>
        </section>
      </div>
      <CallToActionSection />
    </main>
  );
}

import { SphereMask } from "@acme/ui/magicui/sphere-mask";

import { CallToActionSection } from "../_components/cta-section";

export default function Page() {
  return (
    <main className="mx-auto flex flex-1 flex-col gap-64 overflow-hidden">
      <div className="relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8">
        <h1 className="text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent [--animation-delay:200ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
          Terms Of Service
        </h1>
        <SphereMask />
        <section className="container mt-24 flex max-w-5xl flex-col gap-8 text-left">
          <div>
            <h2 className="mb-1 mt-5 text-xl">CoFounder, Inc.</h2>
            <h2 className="mb-4">Terms of Service</h2>
            <p>
              <strong>Effective Date: May 15, 2024</strong>
            </p>
          </div>
          <p>
            These Terms of Service (this “Agreement”) govern the use of the
            Services (as defined below), and is entered into between CoFounder
            Inc. (CoFounder) and Customer (as defined in the Order).
          </p>
          <p>
            By accepting this Agreement, either by clicking a box indicating
            your acceptance, agreeing to an Order or other document that
            references this Agreement, by using (or making any payment for) the
            Services, or by otherwise indicating your acceptance of this
            Agreement, you: (1) agree to this Agreement on behalf of the
            organization, company, or other legal entity for which you act
            (“Customer”); and (2) represent that you have the authority to bind
            Customer to this Agreement. If you do not have such authority, or if
            you do not agree with this Agreement, you must not accept this
            Agreement and may not use the Services.
          </p>
          <h4>1. Definitions.</h4>
          <p>
            <strong>A. “Applicable Law”</strong> means all international,
            federal, state, provincial, and local laws, rules, regulations,
            binding regulatory guidance, directives, and governmental
            requirements applicable to the Services, or either party’s
            performance under this Agreement.
          </p>
          <p>
            <strong>B. “Authorized Users”</strong> means employees and
            contractors of Customer for whom Customer has paid all applicable
            fees for access to and use of the CoFounder Platform.
          </p>
          <p>
            <strong>C. “CoFounder API”</strong> means CoFounder’s proprietary
            toolkit, including any application programming interface that
            CoFounder makes available, together with associated source code,
            tools, and other materials, that allows building, deploying,
            managing and training generative AI projects, available through the
            Site or through other channels as determined by CoFounder (e.g.
            CoFounder’s developer hub).
          </p>
          <p>
            <strong>D. “CoFounder Platform”</strong> means CoFounder’s
            proprietary software-as-a-service AI application that allows more
            efficient collection and parsing of data.
          </p>
          <p>
            <strong>E. “Confidential Information”</strong> means information
            that either party (“Discloser”) discloses to the other party
            (“Recipient”) under this Agreement, and that is marked as
            confidential or would normally be considered confidential
            information under the circumstances. “Confidential Information” does
            not include information that Recipient can document: (1) is
            independently developed by Recipient; (2) is rightfully given to
            Recipient by a third party without confidentiality obligations; or
            (3) becomes public through no fault of Recipient. CoFounder’s
            Confidential Information includes the Documentation, and non-public
            information regarding features, functionality, and performance of
            the CoFounder Platform. Customer’s Confidential Information includes
            the Customer Data.
          </p>
          <p>
            <strong>F. “Customer Data”</strong> means all non-public data and
            content uploaded by Customer or an Authorized User to the CoFounder
            Platform or made available to CoFounder by or on behalf of Customer
            in the course of providing the Services. “Customer Data” does not
            include Usage Data.
          </p>
          <p>
            <strong>G. “Documentation”</strong> means user documentation, in all
            forms, relating to the CoFounder Platform made available by
            CoFounder (e.g., user manuals and online help files).
          </p>
          <p>
            <strong>H. “Intellectual Property Rights”</strong> means all
            intellectual property and proprietary rights throughout the world,
            including patent rights (including utility models), copyrights,
            moral rights, trademark and service mark rights, trade secret
            rights, and any other similar proprietary or intellectual property
            rights.
          </p>
          <p>
            <strong>I. “Order”</strong> means an ordering document or online
            order specifying the Services, including, where applicable, the
            subscription plan, to be provided under this Agreement that is
            entered into between Customer and CoFounder (including any addenda
            and supplements thereto).
          </p>
          <p>
            <strong>J. “Order Term”</strong> means the Order term length
            specified in the applicable Order.
          </p>
          <p>
            <strong>K. “Service Limitations”</strong> means any limitations on
            Customer’s use of the CoFounder Platform specified in an Order,
            including number of Authorized Users and Customer Property Users.
          </p>
          <p>
            <strong>L. “Services”</strong> means CoFounder’s provision of the
            CoFounder Platform, Support Services, and any other services
            described in the applicable Order.
          </p>
          <p>
            <strong>M. “Usage Data”</strong> means data relating to use of the
            CoFounder Platform or any Authorized User’s use of any of the
            foregoing, that is aggregated and/or deidentified in such a way that
            it is not associated with Customer or any Authorized User.
          </p>

          <h4>2. Services.</h4>
          <p>
            <strong>A. Access to the CoFounder Platform.</strong> Subject to
            Customer’s payment of all fees and compliance with this Agreement,
            CoFounder grants to Customer a worldwide, non-exclusive,
            non-transferable, non-sublicensable right during the Order Term to
            use the CoFounder Platform by and through its Authorized Users in
            support of Customer’s business operations and in accordance with any
            Service Limitations and Documentation. CoFounder may modify or
            update the CoFounder Platform from time to time to keep the
            CoFounder Platform current and relevant for its customer base
            generally.
          </p>
          <p>
            <strong>B. Registration.</strong> To use the Services, Customer must
            create and register an account with CoFounder. Customer represents
            and warrants that all information provided to CoFounder in
            connection with such registration is true, accurate, and complete.
            Except as prohibited by law, CoFounder may refuse registration or
            its initial provision of Services for any reason or no reason.
          </p>
          <p>
            <strong>C. Orders.</strong> Each Order is subject to, and hereby
            incorporated into, this Agreement. If there is a conflict between
            this Agreement and an Order, this Agreement will control unless the
            Order expressly states that a specific provision of this Agreement
            will be superseded by a specific provision of the Order.
          </p>
          <p>
            <strong>D. API License.</strong> Subject to Customer’s payment of
            all fees and compliance with this Agreement, CoFounder grants to
            Customer a worldwide, non-exclusive, non-transferable,
            non-sublicensable right during the Order Term to (1) send calls to
            and receive calls from the CoFounder API in solely in connection
            with Customer’s authorized use of the Services functionality set
            forth in an Order, (2) internally reproduce and modify the CoFounder
            API to enable Customer to develop an integration between Customer’s
            internal systems and the CoFounder Platform, in each case, solely as
            described in the Documentation.
          </p>
          <p>
            <strong>E. Support Services.</strong> Subject to Customer’s payment
            of all Fees and compliance with this Agreement, CoFounder will
            provide support relating to usage of the Services via email and the
            support functions within the CoFounder Platform, or as otherwise
            described in the applicable Order (the “Support Services”).
          </p>
          <p>
            <strong>F. Subcontractors.</strong> CoFounder may use subcontractors
            (including with respect to the processing of information) or other
            third parties to perform its obligations under this Agreement, but
            CoFounder will remain responsible for all such obligations.
          </p>

          <h4>3. Use Restrictions and Responsibilities.</h4>
          <p>
            <strong>A. Use Restrictions.</strong> Except as may be expressly
            permitted in this Agreement, Customer will not, and will not
            authorize third parties to: (1) license, sub-license, sell,
            transfer, distribute, share, rent, lease, or otherwise permit third
            parties to use CoFounder Platform or Documentation; (2) use the
            CoFounder Platform, or Documentation to provide services to third
            parties (e.g., as a service bureau); (3) use the CoFounder Platform
            in violation of the Service Limitations or this Agreement; (4)
            circumvent or disable any security or other technological features
            or measures of the CoFounder Platform; (5) reverse engineer,
            decompile, disassemble, or otherwise attempt to discover the source
            code, object code, or underlying structure, ideas, know-how, or
            algorithms relevant to the CoFounder Platform; (6) modify,
            translate, or create derivative works based on the CoFounder
            Platform, or Documentation; (7) remove any proprietary notices or
            labels from the CoFounder Platform or Documentation; (8) use the
            CoFounder Platform in a manner that violates or attempts to
            circumvent Applicable Law; (9) use the CoFounder Platform to
            distribute any viruses or other malicious code, or to transmit large
            amounts of data in a way that would be expected to have a
            detrimental effect on the CoFounder Platform; or (10) access the
            CoFounder Platform to develop a competing product or service.
          </p>
          <p>
            <strong>B. Authorized Users; Accounts.</strong> Customer is
            responsible and liable for all actions and inactions by its
            Authorized Users or by any other person or entity to whom Customer
            or an Authorized User may, directly or indirectly, provide access to
            or permit to use, deploy, or otherwise benefit from the CoFounder
            Platform (“Downstream Entities”); in each case, as if such action or
            inaction were an action or inaction of Customer. As part of the
            registration process, Customer will identify an administrative
            username and password for Customer’s CoFounder Platform account.
            Customer represents and warrants that all registration information
            Customer provides is truthful, accurate, and complete, and that
            Customer will maintain the accuracy of such information. Customer is
            responsible for maintaining control over Customer’s account,
            including the confidentiality of Customer’s username and password,
            and is responsible for all activities that occur on or through
            Customer’s account and all Authorized Users’ accounts, whether
            authorized by Customer or not.
          </p>
          <p>
            <strong>C. Third-Party Software.</strong> Certain components of
            software included as part of the Services, such as through
            integrations made available by CoFounder, are licensed from third
            parties and are subject to terms and conditions provided by such
            third parties, including open-source or private models, algorithms,
            and systems ("Third-Party Software"). Each component of Third-Party
            Software is licensed under the terms of the license that accompanies
            such Third-Party Software, which may include open-source licenses.
            Nothing in this Agreement limits Company’s rights under, or grants
            Company rights that supersede rights available in, the terms and
            conditions of any applicable license for the Third-Party Software.
            Third-Party Software may be subject to separate license agreements
            or restrictions on use ("Third-Party Restrictions"), and Company
            agrees to comply with all such Third-Party Restrictions. THIRD-PARTY
            SOFTWARE IS PROVIDED BY THIRD PARTIES, NOT COFOUNDER. COFOUNDER DOES
            NOT WARRANT, SUPPORT, OR ACCEPT RESPONSIBILITY OF ANY KIND FOR
            THIRD-PARTY SOFTWARE.
          </p>
          <p>
            <strong>D. Optional Third-Party Services.</strong> CoFounder and
            third parties may make available integrations between the Services
            and third-party products or services, including plugins and related
            services ("Third-Party Services") that Company may elect to use. Any
            use of such Third-Party Services is solely between Company and the
            applicable Third-Party Service provider. Because the Third-Party
            Services rely on the Third-Party Service provider's continued
            operation, CoFounder does not warrant or provide support for
            Third-Party Services. CoFounder is not responsible for any
            violations of Applicable Law by Third-Party Service providers, or
            for any liability arising from Company’s use thereof. CoFounder does
            not guarantee the continued availability of any Third-Party Services
            (or any integration with Third-Party Services or related Service
            features), and if such Third-Party Services or related features are
            discontinued, Company will not be entitled to any refund, credit, or
            other compensation. Depending on Company’s location, certain
            Third-Party Services may not be available.
          </p>

          <h4>4. Intellectual Property and Data.</h4>
          <p>
            <strong>A. Content</strong>
          </p>
          <p>
            <strong>Input and Output.</strong> Certain features of the Services
            enable Authorized Users to provide input (such ads files containing
            a company’s regulatory disclosures and press statements) to the
            CoFounder Platform (“Input”), and receive output generated and
            returned thereby based on such Input (“Output”). Input and Output
            are collectively “Content.” As between the parties and to the extent
            permitted by Applicable Law, Company owns all Input. To the extent
            permitted by Applicable Law and the Third-Party Software, and
            subject to Company’s compliance with this Agreement, CoFounder
            hereby assigns to Company all its right, title and interest in and
            to Output; provided, CoFounder may use Content to provide, improve
            and maintain the Services, including sharing with Third-Party
            Software providers, comply with Applicable Law, and enforce its
            policies.
          </p>
          <p>
            <strong>Accuracy.</strong> Given the nature of machine learning
            algorithms, use of the Services may in some situations result in
            incorrect Output. Company agrees and acknowledges it should evaluate
            the accuracy of any Output as appropriate for its use case,
            including by using human review of the Output.
          </p>
          <p>
            <strong>Responsibility for User Content.</strong> Company is solely
            responsible for its Input and the consequences of providing it to
            the Services. None of the Input (other than Customer Data) will be
            subject to any obligation of CoFounder, whether of confidentiality,
            attribution, or otherwise, and CoFounder is not liable for any use
            or disclosure of any Input. CoFounder may (but is not obligated to)
            remove or alter any Input at any time for any reason. Except as
            expressly stated herein (including Section 4.B), CoFounder neither
            endorses nor is responsible for any Input.
          </p>
          <p>
            <strong>B. Customer Data.</strong> Customer owns the Customer Data,
            including all Intellectual Property Rights therein. No ownership
            rights in the Customer Data are transferred to CoFounder by this
            Agreement. CoFounder does not have any rights to the Customer Data
            except for the limited express rights granted in this Agreement.
            Customer hereby grants CoFounder a worldwide, perpetual,
            non-exclusive, irrevocable, royalty-free, fully paid, sublicensable
            (to CoFounder’s third-party service providers) license to host,
            store, transfer, display, perform, reproduce, modify, create
            derivative works of, and distribute Customer Data, in whole or in
            part, in any media or distribution methods now known or later
            developed, solely during the Term and as necessary for CoFounder to
            provide the Services to Customer and in accordance with the settings
            on Customer’s account and the features of the Services Customer
            elects to utilize.
          </p>
          <p>
            <strong>C. CoFounder IP.</strong> CoFounder and its licensors own
            the CoFounder Platform, Documentation, and Usage Data, including all
            Intellectual Property Rights therein (the “CoFounder IP”). No
            ownership rights in the CoFounder IP are transferred to Customer by
            this Agreement. Customer does not have any rights in or to the
            CoFounder IP except for the limited express rights granted in this
            Agreement.
          </p>
          <p>
            <strong>D. Feedback.</strong> If Customer gives CoFounder feedback,
            comments, or suggestions concerning the Services (collectively,
            “Feedback”), Customer hereby assigns to CoFounder all right, title,
            and interest in and to the Feedback, and CoFounder is free to use
            the Feedback without payment, attribution, or restriction.
          </p>
          <p>
            <strong>E. Usage Data.</strong> CoFounder may collect and analyze
            Usage Data and other information relating to the provision, use, and
            performance of various aspects of the CoFounder Platform and related
            systems and technologies (including information provided by
            third-party analytical tools). CoFounder may use Usage Data for any
            purpose, including to improve the Services and develop new products,
            services, features, and functionality.
          </p>

          <h4>5. Confidentiality.</h4>
          <p>
            Each party as Recipient will take reasonable precautions to protect
            Discloser’s Confidential Information and will not use (except as
            expressly permitted in this Agreement) or divulge to any third party
            any Confidential Information except to those employees and
            representatives of Recipient who have a need to know the
            Confidential Information to enable Recipient to perform its
            obligations under this Agreement. Recipient is responsible and
            liable for its employees’ and representatives’ compliance with this
            Section, as if their actions or inactions were an action or inaction
            of Recipient. The foregoing will not apply with respect to any
            Confidential Information five years after the disclosure thereof
            (or, with respect to trade secrets, for so long as such Confidential
            Information constitutes a trade secret under Applicable Law), or any
            Confidential Information that is required to be disclosed by
            Applicable Law.
          </p>

          <h4>6. Fees and Payment.</h4>
          <p>
            <strong>A. Fees and Payment.</strong>
          </p>
          <p>
            Customer will pay CoFounder all fees for the use of the Services
            described in an Order in accordance with the terms therein (“Fees”);
            provided, if in any month Customer exceeds the monthly users
            permitted under its Order subscription plan, Customer will pay
            CoFounder all fees associated with CoFounder’s then-current plan
            pricing allowing for such number of monthly users. If in any month
            Customer exceeds the monthly users permitted under any standard
            CoFounder subscription plan, CoFounder may (without limiting any
            other available remedy to CoFounder) restrict Customer’s usage to
            the maximum monthly users (or any greater amount, in CoFounder’s
            sole discretion) permitted under a standard subscription plan.
            CoFounder may change the Fees or applicable charges or institute new
            charges and Fees at the end of the initial Order Term or
            then-current renewal Order Term, upon 30 days’ prior notice to
            Customer (which may be sent by email). If Customer believes that
            CoFounder has billed Customer incorrectly, Customer must contact
            CoFounder no later than 30 days after the closing date on the first
            billing statement in which the error or problem appeared, to receive
            an adjustment or credit. All Fees are non-refundable, except as
            otherwise specified in this Agreement.
          </p>
          <p>
            CoFounder, in its sole discretion and at any time, may modify Fees;
            provided, any Fee change will become effective after the end of the
            then-current billing cycle. CoFounder will provide Company with
            reasonable prior notice of any such change and allow Company to
            terminate this Agreement or any affected Order before such change
            becomes effective. Company’s continued use of Services after a Fee
            change comes into effect constitutes Company’s agreement to pay the
            modified Fee amount.
          </p>
          <p>
            Unless otherwise set out in the applicable Order, Subscription Fees
            and Usage Fees are payable within thirty (30) days following the
            month such Fees are incurred. Unpaid amounts (including due to
            Customer’s failure to maintain up-to-date and accurate billing
            information in connection with its account) are subject to a finance
            charge of 1.5% per month on any outstanding balance, or the maximum
            amount permitted by Applicable Law, whichever is lower, plus all
            expenses of collection, and may result in immediate termination of
            access to the CoFounder Platform. Customer will pay all Fees in U.S.
            Dollars.
          </p>
          <p>
            <strong>B. Payment Processing.</strong> CoFounder may require
            payment by credit card, debit card, or other payment instruments
            which are processed and billed by CoFounder’s third-party payment
            processors (“Payment Processor”). Customer hereby authorizes
            CoFounder’s Payment Processors to bill Customer’s payment instrument
            on file with CoFounder (or provided by or on behalf of Customer to
            CoFounder or a Payment Processor in connection with any invoice or
            charge) in accordance with each Order. Such billing may include
            advance payment on a periodic basis and ad hoc charges for usage
            Fees and other one-time payments. CoFounder will provide Customer
            with, or otherwise make available to Customer, a receipt for each
            such charge. If CoFounder’s Payment Processor is Stripe Inc.
            (“Stripe”), the processing of credit card charges or credits through
            Stripe, as applicable, relating to use of the Service is subject to
            the Stripe Connected Account Agreement
            (https://stripe.com/connect-account/legal), which includes the
            Stripe Terms of Service (https://stripe.com/legal) (collectively,
            the “Stripe Services Agreement”). Customer hereby agrees to be bound
            by the Stripe Services Agreement, which may be modified by Stripe
            from time to time as set forth therein. Customer agrees to provide
            CoFounder and its Payment Processors with current, accurate, and
            complete information about Customer and Customer’s payment methods.
          </p>
          <p>
            <strong>C. Taxes.</strong> Other than federal and state net income
            taxes imposed on CoFounder, Customer will bear all taxes, duties,
            and other governmental charges relating to the Services.
          </p>

          <h4>7. Term and Termination.</h4>
          <p>
            <strong>A. Term.</strong> The term of this Agreement will commence
            on the effective date of the first Order between the parties and
            will continue until terminated in accordance with this Agreement
            (the “Term”). If a term is not specified in an Order, the term of
            such Order will be 1 month. Upon expiration of an Order, the Order
            will automatically renew for a term equivalent to the initial term
            of such Order, unless either party notifies the other in writing of
            its desire to terminate the applicable Order at least 2 business
            days before the expiration of the then-current term.
          </p>
          <p>
            <strong>B. Termination for Breach or Insolvency.</strong> Either
            party may terminate this Agreement or an Order, effective upon
            written notice to the other party, if the other party materially
            breaches this Agreement or an Order and such breach is incapable of
            cure, or (if such breach capable of cure) the breaching party does
            not cure such breach within 30 days of receiving notice of it.
            CoFounder may terminate or suspend this Agreement or any part of it
            immediately upon written notice to Customer without a cure period if
            Customer breaches Section 3.A or any of the terms of this Agreement
            relating to CoFounder’s Intellectual Property Rights or CoFounder’s
            Confidential Information. CoFounder may terminate this Agreement,
            effective immediately upon written notice, if Customer files, or has
            filed against it, a petition for voluntary or involuntary bankruptcy
            or pursuant to any other insolvency law, makes or seeks to make a
            general assignment for the benefit of its creditors, or applies for,
            or consents to, the appointment of a trustee, receiver, or custodian
            for a substantial part of its property.
          </p>
          <p>
            <strong>C. Effect of Termination.</strong> Expiration or termination
            of this Agreement will automatically terminate all active Orders,
            but termination of a single Order will not result in termination of
            this Agreement or any other Orders. Upon the expiration or
            termination of this Agreement or an Order all rights and licenses
            granted by CoFounder to Customer under this Agreement or the
            applicable Order will terminate. Either party’s termination of this
            Agreement is without prejudice to any other remedies it may have at
            law or in equity, and does not relieve either party of breaches
            occurring prior to the effective date of termination. Neither party
            will be liable to the other for damages arising solely as a result
            of terminating this Agreement in accordance with its terms.
          </p>
          <p>
            <strong>D. Post-Termination Obligations.</strong> Upon any
            expiration or termination of this Agreement, CoFounder will make all
            Customer Data then held by CoFounder available to Customer for
            electronic retrieval for a period of 30 days. After such period,
            CoFounder will delete any stored Customer Data. Upon expiration or
            termination of this Agreement for any reason: (1) CoFounder will not
            refund Customer any Fees paid in advance of such expiration or
            termination; and (2) within ten days after such expiration or
            termination, Customer will pay CoFounder all remaining usage Fees
            owed under any terminated Order. The following sections of this
            Agreement will survive any expiration or termination of this
            Agreement: Sections 1 (Definitions), 4 (Intellectual Property and
            Data), 5 (Confidentiality), 6 (Fees and Payment), 7.C (Effect of
            Termination), 7.D (Post-Termination Obligations), 8.D
            (Combinations), 8.E (Disclaimer), 9 (Indemnification), 10
            (Limitations of Liability), 11(Arbitration), and 12 (Miscellaneous).
          </p>

          <h4>8. Warranties and Disclaimer.</h4>
          <p>
            <strong>A. Mutual Warranties.</strong> Each party represents and
            warrants to the other that: (1) this Agreement has been duly
            executed and delivered and constitutes a binding agreement
            enforceable against the executing party in accordance with its
            terms; (2) no authorization or approval from any third party is
            required in connection with the execution, delivery, or performance
            of this Agreement by the executing party; and (3) the execution and
            delivery of this Agreement by the executing party do not violate
            Applicable Law or the terms of any other agreement to which it is a
            party or by which it is otherwise bound.
          </p>
          <p>
            <strong>B. CoFounder Warranty.</strong> CoFounder represents and
            warrants to Customer that: (1) CoFounder will perform the Services
            in a good and workmanlike manner; and (2) CoFounder has the
            necessary rights to authorize Customer to use the CoFounder Platform
            in accordance with this Agreement.
          </p>
          <p>
            <strong>C. Customer Warranty.</strong> Customer represents and
            warrants to CoFounder that it: (1) has the rights and consents
            necessary and appropriate to authorize and permit CoFounder to use
            all data and information provided or made available to it by or on
            behalf of Customer (including all Input) in accordance with this
            Agreement, and such use by CoFounder of Input will not infringe or
            violate any third-party (including any Authorized User) right,
            including any Intellectual Property Right or privacy right; (2) will
            use the CoFounder Platform in compliance with the Documentation and
            Applicable Law; (3) will provide and maintain accurate, current and
            complete information required to enable Authorized Users to register
            for and use the CoFounder Platform; and (4) unless Company has
            received sufficient prior written authorization, Input does not
            contain any confidential information of any third party.
          </p>
          <p>
            <strong>D. Combinations.</strong> CoFounder will have no obligation
            for any infringement of Intellectual Property Rights relating to
            Customer’s use of the CoFounder Platform to the extent arising out
            of: (1) use of CoFounder Platform in combination with other products
            or services not recommended or provided by CoFounder; (2) designs,
            requirements, or specifications required by or provided by Customer;
            (3) use of the CoFounder Platform in breach of this Agreement or
            outside the scope of the license granted to Customer; (4) Customer’s
            failure to use CoFounder Platform in accordance with the
            Documentation; or (5) any modification of the CoFounder Platform not
            made or authorized in writing by CoFounder.
          </p>
          <p>
            <strong>E. Disclaimer.</strong> Except for the limited warranties
            described in this Section 8 (Warranties and Disclaimer), CoFounder
            makes no other express or implied warranties with respect to the
            CoFounder Platform, Documentation, Services, or otherwise, and
            specifically disclaims all implied and statutory warranties,
            including the implied warranties of non-infringement of third-party
            rights, merchantability, satisfactory quality, accuracy, title, and
            fitness for a particular purpose, and any warranties arising from
            course of dealing, usage, or trade practice. Except for the limited
            warranties described in this Section 8, the CoFounder Platform,
            Documentation, and Services are provided “as is.” CoFounder does not
            warrant that the CoFounder Platform, Documentation, or Services will
            satisfy Customer’s requirements, are without defect or error, or
            that the operation of the CoFounder Platform will be uninterrupted.
            CoFounder makes no warranties of any kind with respect to any Third
            Party Software. Some jurisdictions do not allow the exclusion or
            limitation of warranties, so that limitation or exclusion may not
            apply to Customer.
          </p>
          <p>
            <strong>
              F. CoFounder may make features of the CoFounder Platform
              classified as “alpha” or “beta” available to Customer (“Beta
              Features”). CoFounder makes no representations that any Beta
              Features will be made generally available and CoFounder may
              discontinue or modify any Beta Feature without notice. Beta
              Features are provided “AS IS,” and Customer’s use of a Beta
              Feature is at Customer’s sole risk.
            </strong>
          </p>

          <h4>9. Indemnification.</h4>
          <p>
            <strong>A. Defense.</strong> At CoFounder’s option and request,
            Customer will defend CoFounder and its officers, directors,
            employees, agents, service providers, licensors, and affiliates
            (collectively, the “CoFounder Indemnified Parties”) from any actual
            or threatened third-party claim, proceeding, suit, action, or
            inquiry arising out of or based on Customer’s breach of Section 3
            (Use Restrictions and Responsibilities) or Section 8 (Warranties and
            Disclaimer) (a “Customer Indemnifiable Claim”). If CoFounder
            requests Customer to defend it from any Customer Indemnifiable
            Claim, CoFounder will: (1) give Customer prompt written notice of
            the Customer Indemnifiable Claim; (2) grant Customer full and
            complete control over the defense and settlement of the Customer
            Indemnifiable Claim; (3) provide assistance in connection with the
            defense and settlement of the Customer Indemnifiable Claim as
            Customer may reasonably request; and (4) comply with any settlement
            or court order made in connection with the Customer Indemnifiable
            Claim. Notwithstanding the previous sentence, Customer will not
            enter into any settlement that involves an admission of guilt or
            liability of CoFounder without CoFounder’s prior written consent.
            CoFounder may participate in the defense of a Customer Indemnifiable
            Claim at its own expense and with counsel of its own choosing.
          </p>
          <p>
            <strong>B. Indemnification.</strong> Customer will indemnify the
            CoFounder Indemnified Parties from and pay: (1) all damages, costs,
            fines, judgements, expenses, and attorneys’ fees reasonably incurred
            by CoFounder Indemnified Parties in any Customer Indemnifiable
            Claim); and (2) all amounts that Customer agrees to pay to any third
            party to settle any Customer Indemnifiable Claim.
          </p>
          <p>
            <strong>C. IP Infringement.</strong> If the CoFounder Platform is
            held to infringe (or if CoFounder reasonably believes will be held
            to infringe) any third-party Intellectual Property Rights, CoFounder
            may, at its option and expense: (1) modify the CoFounder Platform to
            make it non-infringing; or (2) obtain a license that permits
            Customer to continue using the CoFounder Platform. If CoFounder does
            not believe either option is reasonably practicable, CoFounder may
            terminate this Agreement. This Section 9 states CoFounder’s sole and
            exclusive liability, and Customer’s sole and exclusive remedy, for
            the actual or alleged infringement of any third-party Intellectual
            Property Rights arising from Customer’s use of the CoFounder
            Platform.
          </p>

          <h4>10. Limitations of Liability.</h4>
          <p>
            <strong>A. Exclusion of Damages.</strong> CoFounder will not be
            liable to Customer for any consequential, incidental, special, or
            exemplary damages arising out of or related to this Agreement,
            including lost profits or loss of business, even if CoFounder is
            apprised of the likelihood of such damages occurring.
          </p>
          <p>
            <strong>B. Damages Cap.</strong> CoFounder’s total liability of all
            kinds arising out of or related to this Agreement (including
            warranty claims), regardless of the forum and regardless of whether
            any action or claim is based on contract, tort, or otherwise, will
            not exceed the total amount paid by Customer to CoFounder under this
            Agreement during the 12 months immediately proceeding the claim,
            less any liabilities previously incurred by CoFounder.
          </p>
          <p>
            <strong>C. Applicability.</strong> Some jurisdictions do not allow
            the exclusion or limitation of damages. This Section 10 (Limitations
            of Liability) will apply to Customer solely to the extent permitted
            by Applicable Law.
          </p>

          <h4>11. Arbitration.</h4>
          <p>
            Any claim, dispute, or controversy between the parties arising out
            of or relating to this Agreement which cannot be satisfactorily
            settled by the parties will be finally and exclusively settled by
            binding arbitration (“Arbitration”) upon the written request of
            either party. The Arbitration will be administered under the
            American Arbitration Association’s Commercial Dispute Resolution
            Procedures in force when the notice of arbitration is submitted (the
            “Rules”). The Arbitration will be conducted by one arbitrator
            selected in accordance with the Rules. The seat of the Arbitration
            will be in New York, New York. The Arbitration will be conducted in
            English. The Arbitration award will be final and binding upon the
            parties, and judgment upon such award may be entered in any court
            having jurisdiction. The Arbitration proceedings and any award will
            be each party’s Confidential Information. The arbitrator’s award may
            include compensatory damages against either party but the arbitrator
            will not be authorized to and will not award punitive damages
            against either party. The parties agree to keep confidential the
            existence of the arbitration, the arbitral proceedings, the
            submissions made by the parties, and the decisions made by the
            arbitrator, including its awards, except as required by Applicable
            Law and to the extent not already in the public domain. Nothing in
            this Agreement will be deemed to waive, preclude, or otherwise limit
            the right of either party to: (A) seek injunctive relief in a court
            of law; or (B) to file suit in a court of law to address an
            intellectual property infringement claim.
          </p>

          <h4>12. Miscellaneous.</h4>
          <p>
            <strong>A. Publicity.</strong> CoFounder may publicly list Customer
            as a customer of CoFounder and use Customer’s trademark, trade name,
            and logo for marketing or promotional purposes and in other
            communications with existing or potential CoFounder customers,
            resellers, or investors.
          </p>
          <p>
            <strong>B. Governing Law.</strong> This Agreement is governed by New
            York law without reference to its conflict of laws principles. The
            United Nations Convention on Contracts for the International Sale of
            Goods will not apply to this Agreement. Subject to Section 11, all
            claims arising under this Agreement will be litigated exclusively in
            the federal or state courts in New York, New York. The parties
            submit to the jurisdiction in those courts.
          </p>
          <p>
            <strong>C. Injunctive Relief.</strong> If either party breaches
            Sections 3.A (Use Restrictions), 4 (Intellectual Property and Data)
            or 5 (Confidentiality), the other party may suffer irreparable harm,
            and monetary damages may be inadequate to compensate the
            non-breaching party. Accordingly, either party may, in addition to
            any other remedies available to it at law or in equity, seek
            injunctive or other equitable relief in response to any such breach.
          </p>
          <p>
            <strong>D. Further Assurances.</strong> Each party will execute and
            deliver any documents or instruments, and take any further actions
            that are reasonably required, to provide the other party the full
            benefits and rights described in this Agreement.
          </p>
          <p>
            <strong>E. Attorneys’ Fees.</strong> In any action or proceeding to
            enforce rights under this Agreement, the prevailing party will be
            entitled to recover costs and attorneys’ fees.
          </p>
          <p>
            <strong>F. Assignment.</strong> Customer may not assign this
            Agreement or delegate its performance without CoFounder’s prior
            written consent, and any attempt to do so is void. CoFounder may
            assign this Agreement or delegate its performance without Customer’s
            consent. This Agreement is binding upon and inures to the benefit of
            the parties’ permitted successors and assigns.
          </p>
          <p>
            <strong>G. Severability.</strong> If any provision of this Agreement
            or portion of a provision is invalid, illegal, or unenforceable, the
            rest of this Agreement will remain in effect.
          </p>
          <p>
            <strong>H. No Waiver.</strong> Neither party will be treated as
            having waived any rights by not exercising (or delaying the exercise
            of) any rights under this Agreement.
          </p>
          <p>
            <strong>I. Entire Agreement.</strong> This Agreement (including the
            Privacy Policy and any Orders) constitutes the entire agreement and
            supersedes any other agreement of the parties relating to its
            subject matter (including any nondisclosure agreements entered into
            in anticipation of this Agreement). Any additional provisions
            (including any “click wrap” terms, terms referenced via URL, or
            otherwise) in any purchase order or other document provided by
            Customer will be void and have no binding effect on CoFounder. No
            usage of trade or other regular practice or method of dealing
            between the parties will be used to modify, interpret, or supplement
            the terms of the Agreement.
          </p>
          <p>
            <strong>J. Amendment.</strong> This Agreement may only be amended in
            a writing signed by both parties and stating that it is amending
            this Agreement.
          </p>
          <p>
            <strong>K. Relationship.</strong> The parties are independent
            contractors of each other. Each party is responsible for instructing
            and managing its employees and personnel. This Agreement does not
            create any agency, partnership, or joint venture relationship
            between the parties.
          </p>
          <p>
            <strong>L. No Third-Party Beneficiaries.</strong> There are no
            third-party beneficiaries of this Agreement.
          </p>
          <p>
            <strong>M. Notices.</strong> All notices under this Agreement must
            be in writing, and will be considered given: (1) upon delivery, if
            delivered personally or by internationally recognized courier
            service; (2) three business days after being sent, if delivered by
            U.S. registered or certified mail (return receipt requested); or (3)
            upon acknowledgement of receipt, if delivered by email. Either party
            may update its notice address by notice to the other party in
            accordance with this Section 12.M. All notices to CoFounder will be
            sent to:
          </p>
          <p>CoFounder, Inc.</p>
          <p>2048 N 78th St, Seattle,</p>
          <p>WA 98103</p>
          <p>Email: support@co-founder.ai</p>
          <p>Attn: Legal</p>
          <p>
            <strong>N. Force Majeure.</strong> CoFounder will not be liable for
            any delay or failure to perform under this Agreement as a result of
            any cause or condition beyond CoFounder’s reasonable control (a
            “Force Majeure Event”), so long as CoFounder uses reasonable efforts
            to avoid or remove those causes of delay or non-performance. If a
            Force Majeure Event causes CoFounder to delay or fail to perform its
            obligations under this Agreement for 30 consecutive days, either
            party may terminate this Agreement.
          </p>
          <p>
            <strong>O. Interpretation.</strong> If CoFounder provides a
            translation of the English language version of this Agreement, the
            translation is provided solely for convenience, and the English
            version will prevail. Any heading, caption, or section title
            contained in this Agreement is for convenience only, and in no way
            defines or explains any section or provision. Any use of the term
            “including” or variations thereof in this Agreement will be
            construed as if followed by the phrase “without limitation.”
          </p>
          <p>
            <strong>P. Counterparts.</strong> This Agreement may be executed in
            counterparts (which may be exchanged by email). Each counterpart
            should be considered an original, but all counterparts together
            should constitute the same Agreement.
          </p>
        </section>
      </div>
      <CallToActionSection />
    </main>
  );
}

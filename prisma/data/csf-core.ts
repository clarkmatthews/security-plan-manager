export type CsfCatalog = {
  functions: {
    code: string;
    name: string;
    description: string;
    categories: {
      code: string;
      name: string;
      description: string;
      subcategories: { code: string; description: string }[];
    }[];
  }[];
};

export const CSF_CORE: CsfCatalog = {
  functions: [
    {
      code: "GV",
      name: "Govern",
      description:
        "The organization's cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored.",
      categories: [
        {
          code: "GV.OC",
          name: "Organizational Context",
          description:
            "The circumstances — mission, stakeholder expectations, dependencies, and legal, regulatory, and contractual requirements — surrounding the organization's cybersecurity risk management decisions are understood.",
          subcategories: [
            { code: "GV.OC-01", description: "The organizational mission is understood and informs cybersecurity risk management." },
            { code: "GV.OC-02", description: "Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered." },
            { code: "GV.OC-03", description: "Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed." },
            { code: "GV.OC-04", description: "Critical objectives, capabilities, and services that stakeholders depend on or expect from the organization are understood and communicated." },
            { code: "GV.OC-05", description: "Outcomes, capabilities, and services that the organization depends on are understood and communicated." },
          ],
        },
        {
          code: "GV.RM",
          name: "Risk Management Strategy",
          description:
            "The organization's priorities, constraints, risk tolerance and appetite statements, and assumptions are established, communicated, and used to support operational risk decisions.",
          subcategories: [
            { code: "GV.RM-01", description: "Risk management objectives are established and agreed to by organizational stakeholders." },
            { code: "GV.RM-02", description: "Risk appetite and risk tolerance statements are established, communicated, and maintained." },
            { code: "GV.RM-03", description: "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes." },
            { code: "GV.RM-04", description: "Strategic direction that describes appropriate risk response options is established and communicated." },
            { code: "GV.RM-05", description: "Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties." },
            { code: "GV.RM-06", description: "Standardized methods for calculating, documenting, categorizing, and prioritizing cybersecurity risks are established and communicated." },
            { code: "GV.RM-07", description: "Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions." },
          ],
        },
        {
          code: "GV.RR",
          name: "Roles, Responsibilities, and Authorities",
          description:
            "Cybersecurity roles, responsibilities, and authorities to foster accountability, performance assessment, and continuous improvement are established and communicated.",
          subcategories: [
            { code: "GV.RR-01", description: "Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving." },
            { code: "GV.RR-02", description: "Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced." },
            { code: "GV.RR-03", description: "Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies." },
            { code: "GV.RR-04", description: "Cybersecurity is included in human resources practices." },
          ],
        },
        {
          code: "GV.PO",
          name: "Policy",
          description: "Organizational cybersecurity policy is established, communicated, and enforced.",
          subcategories: [
            { code: "GV.PO-01", description: "Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced." },
            { code: "GV.PO-02", description: "Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission." },
          ],
        },
        {
          code: "GV.OV",
          name: "Oversight",
          description:
            "Results of organization-wide cybersecurity risk management activities and performance are used to inform, improve, and adjust the risk management strategy.",
          subcategories: [
            { code: "GV.OV-01", description: "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction." },
            { code: "GV.OV-02", description: "The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks." },
            { code: "GV.OV-03", description: "Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed." },
          ],
        },
        {
          code: "GV.SC",
          name: "Cybersecurity Supply Chain Risk Management",
          description:
            "Cyber supply chain risk management processes are identified, established, managed, monitored, and improved by organizational stakeholders.",
          subcategories: [
            { code: "GV.SC-01", description: "A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders." },
            { code: "GV.SC-02", description: "Cybersecurity roles for suppliers, customers, and partners are established, communicated, and coordinated internally and externally." },
            { code: "GV.SC-03", description: "Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes." },
            { code: "GV.SC-04", description: "Suppliers are known and prioritized by criticality." },
            { code: "GV.SC-05", description: "Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties." },
            { code: "GV.SC-06", description: "Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships." },
            { code: "GV.SC-07", description: "The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship." },
            { code: "GV.SC-08", description: "Relevant suppliers and other third parties are included in incident planning, response, and recovery activities." },
            { code: "GV.SC-09", description: "Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle." },
            { code: "GV.SC-10", description: "Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement." },
          ],
        },
      ],
    },
    {
      code: "ID",
      name: "Identify",
      description: "The organization's current cybersecurity risks are understood.",
      categories: [
        {
          code: "ID.AM",
          name: "Asset Management",
          description: "Assets (e.g., data, hardware, software, systems, facilities, services, people) that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization's risk strategy.",
          subcategories: [
            { code: "ID.AM-01", description: "Inventories of hardware managed by the organization are maintained." },
            { code: "ID.AM-02", description: "Inventories of software, services, and systems managed by the organization are maintained." },
            { code: "ID.AM-03", description: "Representations of the organization's authorized network communication and internal and external network data flows are maintained." },
            { code: "ID.AM-04", description: "Inventories of services provided by suppliers are maintained." },
            { code: "ID.AM-05", description: "Assets are prioritized based on classification, criticality, resources, and impact on the mission." },
            { code: "ID.AM-07", description: "Inventories of data and corresponding metadata for designated data types are maintained." },
            { code: "ID.AM-08", description: "Systems, hardware, software, services, and data are managed throughout their life cycles." },
          ],
        },
        {
          code: "ID.RA",
          name: "Risk Assessment",
          description: "The cybersecurity risk to the organization, assets, and individuals is understood by the organization.",
          subcategories: [
            { code: "ID.RA-01", description: "Vulnerabilities in assets are identified, validated, and recorded." },
            { code: "ID.RA-02", description: "Cyber threat intelligence is received from information sharing forums and sources." },
            { code: "ID.RA-03", description: "Internal and external threats to the organization are identified and recorded." },
            { code: "ID.RA-04", description: "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded." },
            { code: "ID.RA-05", description: "Threats, vulnerabilities, likelihoods, and impacts are used to determine risk and inform risk prioritization." },
            { code: "ID.RA-06", description: "Risk responses are chosen, prioritized, planned, tracked, and communicated." },
            { code: "ID.RA-07", description: "Changes and exceptions are managed, assessed for risk impact, recorded, and tracked." },
            { code: "ID.RA-08", description: "Processes for receiving, analyzing, and responding to vulnerability disclosures are established." },
            { code: "ID.RA-09", description: "The authenticity and integrity of hardware and software are assessed prior to acquisition and use." },
            { code: "ID.RA-10", description: "Critical suppliers are assessed prior to acquisition." },
          ],
        },
        {
          code: "ID.IM",
          name: "Improvement",
          description: "Improvements to organizational cybersecurity risk management processes, procedures, and activities are identified across all CSF Functions.",
          subcategories: [
            { code: "ID.IM-01", description: "Improvements are identified from evaluations." },
            { code: "ID.IM-02", description: "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties." },
            { code: "ID.IM-03", description: "Improvements are identified from execution of operational processes, procedures, and activities." },
            { code: "ID.IM-04", description: "Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved." },
          ],
        },
      ],
    },
    {
      code: "PR",
      name: "Protect",
      description: "Safeguards to manage the organization's cybersecurity risks are used.",
      categories: [
        {
          code: "PR.AA",
          name: "Identity Management, Authentication, and Access Control",
          description: "Access to physical and logical assets is limited to authorized users, services, and hardware and is managed commensurate with the assessed risk of unauthorized access.",
          subcategories: [
            { code: "PR.AA-01", description: "Identities and credentials for authorized users, services, and hardware are managed by the organization." },
            { code: "PR.AA-02", description: "Identities are proofed and bound to credentials based on the context of interactions." },
            { code: "PR.AA-03", description: "Users, services, and hardware are authenticated." },
            { code: "PR.AA-04", description: "Identity assertions are protected, conveyed, and verified." },
            { code: "PR.AA-05", description: "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties." },
            { code: "PR.AA-06", description: "Physical access to assets is managed, monitored, and enforced commensurate with risk." },
          ],
        },
        {
          code: "PR.AT",
          name: "Awareness and Training",
          description: "The organization's personnel are provided with cybersecurity awareness and training to perform their cybersecurity-related tasks.",
          subcategories: [
            { code: "PR.AT-01", description: "Personnel are provided with awareness and training so they possess the knowledge and skills to perform general cybersecurity-related tasks." },
            { code: "PR.AT-02", description: "Individuals in specialized roles are provided with awareness and training so they possess the knowledge and skills to perform relevant tasks." },
          ],
        },
        {
          code: "PR.DS",
          name: "Data Security",
          description: "Data are managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information.",
          subcategories: [
            { code: "PR.DS-01", description: "The confidentiality, integrity, and availability of data-at-rest are protected." },
            { code: "PR.DS-02", description: "The confidentiality, integrity, and availability of data-in-transit are protected." },
            { code: "PR.DS-10", description: "The confidentiality, integrity, and availability of data-in-use are protected." },
            { code: "PR.DS-11", description: "Backups of data are created, protected, maintained, and tested." },
          ],
        },
        {
          code: "PR.PS",
          name: "Platform Security",
          description: "The hardware, software (e.g., firmware, operating systems, applications), and services of physical and virtual platforms are managed consistent with the organization's risk strategy to protect their confidentiality, integrity, and availability.",
          subcategories: [
            { code: "PR.PS-01", description: "Configuration management practices are established and applied." },
            { code: "PR.PS-02", description: "Software is maintained, replaced, and removed commensurate with risk." },
            { code: "PR.PS-03", description: "Hardware is maintained, replaced, and removed commensurate with risk." },
            { code: "PR.PS-04", description: "Log records are generated and made available for continuous monitoring." },
            { code: "PR.PS-05", description: "Installation and execution of unauthorized software are prevented." },
            { code: "PR.PS-06", description: "Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle." },
          ],
        },
        {
          code: "PR.IR",
          name: "Technology Infrastructure Resilience",
          description: "Security architectures are managed with the organization's risk strategy to protect asset confidentiality, integrity, and availability, and organizational resilience.",
          subcategories: [
            { code: "PR.IR-01", description: "Networks and environments are protected from unauthorized logical access and usage." },
            { code: "PR.IR-02", description: "The organization's technology infrastructure is protected from environmental threats." },
            { code: "PR.IR-03", description: "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations." },
            { code: "PR.IR-04", description: "Adequate resource capacity to ensure availability is maintained." },
          ],
        },
      ],
    },
    {
      code: "DE",
      name: "Detect",
      description: "Possible cybersecurity attacks and compromises are found and analyzed.",
      categories: [
        {
          code: "DE.CM",
          name: "Continuous Monitoring",
          description: "Assets are monitored to find anomalies, indicators of compromise, and other potentially adverse events.",
          subcategories: [
            { code: "DE.CM-01", description: "Networks and network services are monitored to find potentially adverse events." },
            { code: "DE.CM-02", description: "The physical environment is monitored to find potentially adverse events." },
            { code: "DE.CM-03", description: "Personnel activity and technology usage are monitored to find potentially adverse events." },
            { code: "DE.CM-06", description: "External service provider activities and services are monitored to find potentially adverse events." },
            { code: "DE.CM-09", description: "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events." },
          ],
        },
        {
          code: "DE.AE",
          name: "Adverse Event Analysis",
          description: "Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize cybersecurity attacks and compromises.",
          subcategories: [
            { code: "DE.AE-02", description: "Potentially adverse events are analyzed to better understand associated activities." },
            { code: "DE.AE-03", description: "Information is correlated from multiple sources." },
            { code: "DE.AE-04", description: "The estimated impact and scope of adverse events are understood." },
            { code: "DE.AE-06", description: "Information on adverse events is provided to authorized staff and tools." },
            { code: "DE.AE-07", description: "Cyber threat intelligence and other contextual information are integrated into the analysis." },
            { code: "DE.AE-08", description: "Incidents are declared when adverse events meet the defined incident criteria of the organization." },
          ],
        },
      ],
    },
    {
      code: "RS",
      name: "Respond",
      description: "Actions regarding a detected cybersecurity incident are taken.",
      categories: [
        {
          code: "RS.MA",
          name: "Incident Management",
          description: "Responses to detected cybersecurity incidents are managed.",
          subcategories: [
            { code: "RS.MA-01", description: "The incident response plan is executed in coordination with relevant third parties once an incident is declared." },
            { code: "RS.MA-02", description: "Incident reports are triaged and validated." },
            { code: "RS.MA-03", description: "Incidents are categorized and prioritized." },
            { code: "RS.MA-04", description: "Incidents are escalated or elevated as needed." },
            { code: "RS.MA-05", description: "The criteria for initiating incident recovery are applied." },
          ],
        },
        {
          code: "RS.AN",
          name: "Incident Analysis",
          description: "Investigations are conducted to ensure effective response and support forensics and recovery activities.",
          subcategories: [
            { code: "RS.AN-03", description: "Analysis is performed to establish what has taken place during an incident and the root cause of the incident." },
            { code: "RS.AN-06", description: "Actions performed during an investigation are recorded, and the records' integrity and provenance are preserved." },
            { code: "RS.AN-07", description: "Incident data and metadata are collected, and their integrity and provenance are preserved." },
            { code: "RS.AN-08", description: "An incident's magnitude is estimated and validated." },
          ],
        },
        {
          code: "RS.CO",
          name: "Incident Response Reporting and Communication",
          description: "Response activities are coordinated with internal and external stakeholders as required by laws, regulations, or policies.",
          subcategories: [
            { code: "RS.CO-02", description: "Internal and external stakeholders are notified of incidents." },
            { code: "RS.CO-03", description: "Information is shared with designated internal and external stakeholders." },
          ],
        },
        {
          code: "RS.MI",
          name: "Incident Mitigation",
          description: "Activities are performed to prevent expansion of an event and mitigate its effects.",
          subcategories: [
            { code: "RS.MI-01", description: "Incidents are contained." },
            { code: "RS.MI-02", description: "Incidents are eradicated." },
          ],
        },
      ],
    },
    {
      code: "RC",
      name: "Recover",
      description: "Assets and operations affected by a cybersecurity incident are restored.",
      categories: [
        {
          code: "RC.RP",
          name: "Incident Recovery Plan Execution",
          description: "Restoration activities are coordinated with internal and external parties.",
          subcategories: [
            { code: "RC.RP-01", description: "The recovery portion of the incident response plan is executed once initiated from the incident response process." },
            { code: "RC.RP-02", description: "Recovery actions are selected, scoped, prioritized, and performed." },
            { code: "RC.RP-03", description: "The integrity of backups and other restoration assets is verified before using them for restoration." },
            { code: "RC.RP-04", description: "Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms." },
            { code: "RC.RP-05", description: "The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed." },
            { code: "RC.RP-06", description: "The end of incident recovery is declared based on criteria, and incident-related documentation is completed." },
          ],
        },
        {
          code: "RC.CO",
          name: "Incident Recovery Communication",
          description: "Restoration activities are coordinated with internal and external parties.",
          subcategories: [
            { code: "RC.CO-03", description: "Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders." },
            { code: "RC.CO-04", description: "Public updates on incident recovery are shared using approved methods and messaging." },
          ],
        },
      ],
    },
  ],
};

export function catalogCounts(catalog: CsfCatalog) {
  const functions = catalog.functions.length;
  const categories = catalog.functions.reduce((sum, fn) => sum + fn.categories.length, 0);
  const subcategories = catalog.functions.reduce(
    (sum, fn) => sum + fn.categories.reduce((inner, cat) => inner + cat.subcategories.length, 0),
    0,
  );
  return { functions, categories, subcategories };
}

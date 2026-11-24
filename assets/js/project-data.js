/*
 * Project data extracted from the supplied Word document.
 * Keep raw source values here; calculate totals, ratios, durations and scenario results in JavaScript.
 * EDIT: Change only when the source document changes. Label any non-document model input as an assumption.
 */
(function (global) {
  'use strict';

  // Project identity and charter information.
  // Scope, initial sites, population context and deliverable statements.
  // Schedule periods, activity matrix and timing notes.
  // Budget accounts: money is represented in CAD millions unless stated otherwise.
  // Return / payback source rows and the stated calculation inputs.
  // Operations: stakeholders, recruitment, communication and the source risk register.
  // Management: spheres, frames, life-cycle, process groups, SWOT, quality and HR.
  // Reference-list entries and extracted document structure counts.
  // What-if assumptions: null means the Word document does not provide a value.
  const PROJECT_DATA = {
  "project": {
    "name": "Fraser Valley Preparedness Research Lab",
    "institution": "University of the Fraser Valley",
    "startPeriod": "January 2027",
    "endPeriod": "December 2029",
    "startMonth": "2027-01",
    "closingDate": "2029-12-31",
    "plannedScheduleDescription": "Planned work from January 2027 to December 2029",
    "statedCloseCondition": "This project would close on December 31, 2029, with an accepted operating service.",
    "charterPeople": [
      "Dr. Garry Fehr"
    ],
    "charterPurposeStatements": [
      "This will be the project of university based pandemic preparedness research lab in the University of the Fraser Valley. Its name will be “Fraser Valley Preparedness Research Lab”. Its first purpose will be whether the clinic manager can make a better decision to increase or decrease the staff shifts based on the need. This lab will collect the data and then make patterns and do calculations to figure it out, how much staff we will need from initial phase of the pandemic. (BC Centre for Disease Control, 2026b)",
      "In addition to this, lab can be able to calculate that how early to open extra capacity, which sites can share supplies, and whether the response preserves access in smaller communities. (BC Centre for Disease Control, 2026b)",
      "Second purpose of this lab will be to do research to find better solutions for the next pandemic if happen. For example, doing research with the use of modern technologies like Artificial Intelligence and integration of it in finding the protein structures and finding the weak points of the viruses as soon as possible, so that scientists can find the solution to attack that weak point and then kill the virus at mass scale."
    ],
    "closingStatement": "Ultimately, this lab's contribution is earlier detection, testing protective measures, fewer interruptions in the service of the clinics when the threat of the pandemic will reach the Fraser region. (BC Centre for Disease Control, 2026b)"
  },
  "scope": {
    "initialSites": {
      "quantity": 2,
      "unit": "willing clinical service sites",
      "description": "It will start with two willing clinical service sites for discovery and shadow testing, and both sites will be selected for different operations. Then we will ask each site to name a decision, its deadline, the person able to act and the evidence currently available that will support their decision."
    },
    "softwarePurpose": "The research software that will be part of this project, it will be used to store the data of the decisions taken, evidence behind those decisions, and regional support service actions taken.",
    "populationContext": {
      "censusYear": 2021,
      "population": 324005,
      "comparisonYear": 2016,
      "comparisonPopulation": 295934,
      "growthPercent": 9.5,
      "sourceStatement": "The 2021 census counted 324,005 people in the Fraser Valley and it is up 9.5% from 295,934 in 2016."
    },
    "deliverableHeadings": [
      "What Will Be the Purpose of The Local Alert",
      "Research Software",
      "How the lab will recognize an unusual rise in illness",
      "Biological Border",
      "Pharmaceutical Research Partnerships"
    ],
    "monitoringIndicators": [
      "COVID-19 test positives",
      "proportions of emergency and primary care visits for respiratory illness",
      "respiratory visits",
      "the total number of visits",
      "holidays",
      "days of the week",
      "season",
      "other events throughout the year",
      "wastewater",
      "viruses and bacteria"
    ],
    "researchSoftwareFunctions": [
      "This lab will use different types of data to feed in the research software; it will compare respiratory visits with the total number of visits. It will also include the data like the holidays, days of the week, season, and other events throughout the year, so that number of patients visiting can be compared with these events. (BC Centre for Disease Control, 2026a)",
      "Lab will use AI also to detect the unusual patterns and other instant spikes in the visits. With the integration of the AI, data analyzation will be faster, and decisions can be taken quicker by the clinic's manager.",
      "The second part of the software would predict the number of visits in clinic could expected during the next week. This will also include the number of supplies that will be needed in that clinic for the next week, and it will also take the data from the schedule supply ordering of that clinic and then this software can predict the amount of the supplies needed for the next week. (Fox et al., 2024)"
    ],
    "wastewaterStatement": "Meanwhile, wastewater can provide additional information about the community. For example, wastewater can be tested at regular intervals so that UFV lab will get the data about the viruses and bacteria, which bacteria and viruses are growing, and which viruses are new to humans, can be detected early. (BC Centre for Disease Control, 2026b)",
    "biologicalBorderStatements": [
      "A biological border is needed to build where residents already share indoor air. This can be done by monitoring the air regularly with the use of sensors and it will detect the viruses and meanwhile new viruses that are not known to humans. (World Health Organization, 2021)",
      "To make this possible, there is need to install sensors in every residential building and workplace and that sensors will send data via WIFI to the lab and it will be monitored and continuously analyzed with the AI and Research software, when it will be detected a foreign virus then an alert like alarm will be sounded to alert the people in that building. In addition to this, there will proposed regulations to increase the ventilation so that effect of the viruses will be decreased. (World Health Organization, 2021)"
    ],
    "pharmaceuticalPartnerships": [
      "Eli Lilly",
      "Pfizer",
      "AstraZeneca"
    ],
    "pharmaceuticalPartnershipStatement": "Partnership with Eli Lilly will focus on the methods improve the data of the research software so that model predictions accuracy can be increased. Other partnerships with Pfizer and AstraZeneca regarding the respiratory care. With these companies the development of the vaccines can be accelerated by sharing the real time data with them and they can do their research and then vaccine for the new virus can be invented as soon as possible. (Pfizer, n.d.)"
  },
  "time": {
    "periodLengthMonths": 6,
    "periods": [
      "2027 H1",
      "2027 H2",
      "2028 H1",
      "2028 H2",
      "2029 H1",
      "2029 H2"
    ],
    "activities": [
      {
        "name": "Authority permission and feasibility",
        "periods": [
          "2027 H1"
        ]
      },
      {
        "name": "Data agreements for research software and baseline",
        "periods": [
          "2027 H1",
          "2027 H2"
        ]
      },
      {
        "name": "Build, test research software, installing sensors, collecting refining data with AI, and feeding it into software",
        "periods": [
          "2027 H2",
          "2028 H1",
          "2028 H2"
        ]
      },
      {
        "name": "Live test with clinic sites",
        "periods": [
          "2028 H2"
        ]
      },
      {
        "name": "Expand to more sites (if approved)",
        "periods": [
          "2028 H2",
          "2029 H1"
        ],
        "conditional": true
      },
      {
        "name": "Practice drills and fix problems",
        "periods": [
          "2029 H1",
          "2029 H2"
        ]
      },
      {
        "name": "Accept the service and close the project",
        "periods": [
          "2029 H2"
        ]
      }
    ],
    "timingNotes": [
      {
        "when": "First half of 2027",
        "note": "Confirm project authority, research questions, sample reports, privacy and ethics requirements."
      },
      {
        "when": "If data access is delayed",
        "note": "Use sample or made-up data for early testing; move or reduce live testing.",
        "fallback": true
      },
      {
        "when": "By September 2029",
        "note": "Confirm the final scope of work that can be completed by year-end."
      },
      {
        "when": "October–November 2029",
        "note": "Run final practice tests, check suppliers and fix major problems."
      },
      {
        "when": "First half of December 2029",
        "note": "Hold the final acceptance meeting."
      },
      {
        "when": "Final weeks of December 2029",
        "note": "Finish records, check invoices and hand over the service."
      }
    ],
    "timingNarrative": [
      "This schedule reserves the first half of the 2027 for the decisions that will be taken by the authority. This will include the service managers will supply the sample data reports. Alongside this data agreements can be done after certain approvals, and these agreements will be done with private labs like life lab and others. In these decisions, permissions from the building owners and residential building owners will be gotten to install the sensors to collect the data.",
      "In 2027-2028, building of the research software will be started and data will be collected, alongside with this sensor installation in the buildings will be started. For these 18 months period, development of the software, collection of data will be done.",
      "In second half of 2028, software will be sent to the production environment in which the live data will be tested, and clinic trials will be done to test the software with other clinic management softwares.",
      "After successful implementation of the whole system, it will be expanded to other regions like metro Vancouver and other provinces, it will require the extra compute services for the data collection and there will be required to install the millions of more sensors and this will incur more costs and need more investment. Alongside with the practical drills of these clinics. This whole process is expected to be completed in mid 2029.",
      "In the last six months, if any steps left or errors occurred then that will be solved and then if everything will be implemented successfully then the project will be closed at the end of 2029. (Renso, 2026a)"
    ],
    "textualDurationFacts": [
      {
        "value": 18,
        "unit": "months",
        "context": "For these 18 months period, development of the software, collection of data will be done."
      },
      {
        "value": 6,
        "unit": "months",
        "context": "In the last six months, if any steps left or errors occurred then that will be solved and then if everything will be implemented successfully then the project will be closed at the end of 2029."
      }
    ]
  },
  "cost": {
    "currency": "CAD",
    "amountUnit": "millions",
    "accounts": [
      {
        "id": "campus-space-systems",
        "name": "Campus space and systems",
        "basisText": "5,000 m² × $0.012m = 60; design, building services and commissioning = 30",
        "amount": 90,
        "components": [
          {
            "label": "Campus area",
            "quantity": 5000,
            "unit": "m²",
            "unitCost": 0.012,
            "amount": 60
          },
          {
            "label": "Design, building services and commissioning",
            "amount": 30
          }
        ]
      },
      {
        "id": "regional-access-continuity",
        "name": "Regional access and continuity improvements",
        "basisText": "Up to 30 partner-site packages × 4, conditional on engineering surveys",
        "amount": 120,
        "conditional": true,
        "quantity": 30,
        "quantityQualifier": "up to",
        "unit": "partner-site packages",
        "unitCost": 4
      },
      {
        "id": "secure-analytics-integration",
        "name": "Secure analytics and integration",
        "basisText": "20 partner integration packages × 2 + secure platform build, recovery and commissioning 20",
        "amount": 60,
        "components": [
          {
            "label": "Partner integration packages",
            "quantity": 20,
            "unit": "packages",
            "unitCost": 2,
            "amount": 40
          },
          {
            "label": "Secure platform build, recovery and commissioning",
            "amount": 20
          }
        ]
      },
      {
        "id": "direct-labour-backfill",
        "name": "Direct labour and partner backfill",
        "basisText": "600 FTE-years × 0.150 across the project",
        "amount": 90,
        "quantity": 600,
        "unit": "FTE-years",
        "unitCost": 0.15
      },
      {
        "id": "environmental-evidence",
        "name": "Environmental evidence services",
        "basisText": "20 proposed site equivalents × 3 years × 0.150 = 9; logistics, quality checks and coverage gap assessment = 6",
        "amount": 15,
        "components": [
          {
            "label": "Proposed site equivalents",
            "quantity": 20,
            "unit": "site equivalents",
            "years": 3,
            "unitCostPerSiteYear": 0.15,
            "amount": 9
          },
          {
            "label": "Logistics, quality checks and coverage gap assessment",
            "amount": 6
          }
        ]
      },
      {
        "id": "independent-partnered-research",
        "name": "Independent and partnered research",
        "basisText": "Up to 30 milestone-based research awards × 5, additional to centrally employed staff",
        "amount": 150,
        "quantity": 30,
        "quantityQualifier": "up to",
        "unit": "milestone-based research awards",
        "unitCost": 5,
        "additionalToCentrallyEmployedStaff": true
      },
      {
        "id": "service-continuity-awards",
        "name": "Service-continuity implementation awards",
        "basisText": "Up to 40 evaluated local projects × 5, limited to noncapital delivery costs",
        "amount": 200,
        "quantity": 40,
        "quantityQualifier": "up to",
        "unit": "evaluated local projects",
        "unitCost": 5,
        "noncapitalDeliveryCostsOnly": true
      },
      {
        "id": "training-simulation",
        "name": "Training and simulation delivery",
        "basisText": "100 exercise and training packages × 0.4, including venue, coaching and materials",
        "amount": 40,
        "quantity": 100,
        "unit": "exercise and training packages",
        "unitCost": 0.4
      },
      {
        "id": "participation-accessibility",
        "name": "Participation and accessibility",
        "basisText": "40 community agreements × 0.5 for local facilitation, translation and accessible participation",
        "amount": 20,
        "quantity": 40,
        "unit": "community agreements",
        "unitCost": 0.5
      },
      {
        "id": "independent-assurance",
        "name": "Independent assurance and programme controls",
        "basisText": "10 independent assurance packages × 1.5, including evaluation, audit and readiness review",
        "amount": 15,
        "quantity": 10,
        "unit": "independent assurance packages",
        "unitCost": 1.5
      },
      {
        "id": "deployable-continuity-equipment",
        "name": "Deployable continuity equipment",
        "basisText": "Up to 40 shared equipment lots × 2.5 with spares, warranties and field acceptance",
        "amount": 100,
        "quantity": 40,
        "quantityQualifier": "up to",
        "unit": "shared equipment lots",
        "unitCost": 2.5
      }
    ],
    "documentedTotals": {
      "deliveryBaseline": 900,
      "sponsorControlledReserve": 100,
      "fundingCeiling": 1000
    },
    "firstApprovedSpendingMaximum": 10,
    "firstApprovedSpendingText": "The first approved spending should be a maximum of CAD 10 million",
    "annualOperatingCost": 35,
    "annualOperatingCostText": "Annual net after $35m operations",
    "procurementCriteria": [
      {
        "points": 35,
        "criterion": "How well the product performs in user testing."
      },
      {
        "points": 25,
        "criterion": "Total cost over its lifetime."
      },
      {
        "points": 20,
        "criterion": "Installation and technical support."
      },
      {
        "points": 10,
        "criterion": "Accessibility."
      },
      {
        "points": 10,
        "criterion": "Training and knowledge transfer."
      }
    ],
    "procurementManagerText": "UFV procurement service will manage the purchasing of all resources and the equipments, and they will collaborate with managers of the clinics and municipalities.",
    "procurementSteps": [
      "Before purchasing anything UFV must check the budget and purchasing rules so that overspending can be avoided. (University of the Fraser Valley, Procurement Services, n.d.)",
      "Computer services will be purchased after getting the consultation from the IT person and laboratory and filtration equipment ger the RFP from the suppliers first and then decide which one will be best suited for their research and budget."
    ]
  },
  "returnAnalysis": {
    "annualOperatingCost": 35,
    "investmentBasis": "Total funding ceiling",
    "horizonYears": 10,
    "discountRate": 0.03,
    "scenarios": [
      {
        "annualGrossBenefit": 20,
        "annualNetAfterOperations": -15,
        "statedSimplePayback": "No payback",
        "statedROI": -85.2,
        "statedNPV": -1128.0
      },
      {
        "annualGrossBenefit": 100,
        "annualNetAfterOperations": 65,
        "statedSimplePayback": "15.4 years; beyond horizon",
        "statedROI": -25.9,
        "statedNPV": -445.5
      },
      {
        "annualGrossBenefit": 175,
        "annualNetAfterOperations": 140,
        "statedSimplePayback": "7.1 years",
        "statedROI": 29.6,
        "statedNPV": 194.2
      }
    ],
    "benefitTypes": [
      "Actual savings: Money that partners really save.",
      "Capacity improvements: More appointments or services available.",
      "Community benefits: Improvements to the wider community."
    ],
    "managementConsiderations": [
      "Return on investment and chances of the better investments can be done by first reviewing the data and the reporting data methods that are being used in the research software.",
      "Secondly, by delaying the expensive equipment purchases and can only be bought when the reliable information about that equipment will be available. Third, by testing the situation that if one clinic will not send the data or stop sending in between then what will be the effect of it on the research software development. Then board members can use the SWOT analysing to enhance the investment decisions.",
      "By considering all these things, payback analysis can be done, and better decisions can be taken."
    ]
  },
  "operations": {
    "stakeholderResponsibilities": [
      {
        "role": "Lab director",
        "responsibility": "The lab director will manage the research programme;"
      },
      {
        "role": "Manager of the clinic",
        "responsibility": "manager of the clinic will review the alert and decide whether this alert is important or not."
      },
      {
        "role": "Research team of the lab",
        "responsibility": "Research team of the lab will get the data, refine it and then feed it in the research software."
      },
      {
        "role": "UFV Human Resources",
        "responsibility": "UFV Human Resources will decide employee job classifications. Confirm salaries and employment agreements."
      }
    ],
    "recruitmentGroups": [
      {
        "group": "First group",
        "roles": [
          "Project managers",
          "privacy specialists",
          "community relations staff",
          "clinical reviewers"
        ]
      },
      {
        "group": "Second group",
        "roles": [
          "Epidemiologists",
          "forecasting specialists",
          "health informatics specialists",
          "software integration developers",
          "accessibility specialists",
          "quality assurance staff"
        ]
      },
      {
        "group": "Third group",
        "roles": [
          "Trainers",
          "technical support staff",
          "research coordinators",
          "evaluation staff"
        ]
      },
      {
        "group": "Facilities and purchasing specialists",
        "roles": [],
        "condition": "will join when needed"
      }
    ],
    "studentSupport": [
      "Testing the system using sample data.",
      "Checking whether interfaces are easy to use.",
      "Documenting system changes."
    ],
    "communicationAndReporting": [
      "Weekly forecast reports will be sent to clinic managers, project sponsor will get the weekly progress report and status report, and reports on the spending and unresolved issues. That communication channels will be used that are already being trusted by the stakeholders.",
      "Sponsor will also receive the updated information on the unresolved issues and resolved ones."
    ],
    "conflictHandling": "Different communities may disagree about which clinic will receive the additional staff and supplies in priority the conflicts may happen, so to solve this preset rules should be distributed to the regional clinics, for example, remote clinics will get the priority or where visits are increasing at higher rate will get the extra staff first."
  },
  "risks": [
    {
      "id": 1,
      "name": "Data access delayed",
      "trigger": "No signed permission from the clinics",
      "owner": "Data collector",
      "prevention": "get permissions early"
    },
    {
      "id": 2,
      "name": "Privacy incident",
      "trigger": "Suspected disclosure private information",
      "owner": "Privacy officer",
      "prevention": "Review outputs before release and restrict access."
    },
    {
      "id": 3,
      "name": "False alert or missed rise",
      "trigger": "Reviewer documents on error",
      "owner": "Clinical lead",
      "prevention": "Independently compare signals with ordinary surveillance."
    },
    {
      "id": 4,
      "name": "Poor rural coverage",
      "trigger": "A participating area loses a scheduled feed",
      "owner": "Epidemiology lead",
      "prevention": "Publish completeness of coverage and make the report which will include what areas are covered"
    },
    {
      "id": 5,
      "name": "Platform outage",
      "trigger": "Scheduled briefing cannot be delivered",
      "owner": "IT service owner",
      "prevention": "Rehearse restoration and alternate delivery."
    },
    {
      "id": 6,
      "name": "Reviewer fatigue",
      "trigger": "Repeated actions and reviews overtime",
      "owner": "Operations manager",
      "prevention": "Train the alternates and review hours weekly."
    },
    {
      "id": 7,
      "name": "Cost escalation",
      "trigger": "Compliant bids exceed the work-package ceiling",
      "owner": "Procurement lead",
      "prevention": "Compare whole-life pricing and phase commitments."
    },
    {
      "id": 8,
      "name": "Loss of trust",
      "trigger": "Partner challenges an interpretation or requests withdrawal",
      "owner": "Engagement lead",
      "prevention": "Agree use, review and correction rights in writing."
    },
    {
      "id": 9,
      "name": "Vendor dependence",
      "trigger": "Supplier fails a contracted export or recovery test",
      "owner": "Commercial lead",
      "prevention": "Require documented exports and transition assistance."
    },
    {
      "id": 10,
      "name": "Unfunded operation",
      "trigger": "No signed operating authority at cutover review",
      "owner": "Executive sponsor",
      "prevention": "Obtain a priced service plan and recurring funding decision."
    }
  ],
  "management": {
    "threeSpheres": [
      {
        "name": "Business sphere",
        "description": "Business sphere include for example, by adding the extra shift of a nurse at the clinic will cover the appointments or not. (Renso, 2026b)"
      },
      {
        "name": "Organizational sphere",
        "description": "Organizational sphere include that who have the authority to approve the overtime and organize the team in the need. (Renso, 2026b)"
      },
      {
        "name": "Technology sphere",
        "description": "Technology sphere include that if the research software will deliver the predicted data on time, with accuracy, and with clarity to the clinics. (Renso, 2026b)"
      }
    ],
    "organizationalFrames": [
      {
        "name": "The structural frame",
        "description": "The structural frame shows that who will make which decision, like UFV will do the research, while the clinics will send the data of their patients visits."
      },
      {
        "name": "The human resource frame",
        "description": "The human resource frame will include the training and workshops done by the trainers to train the nurses at the clinics for sending the data to UFV lab. Then ask trainees that whether they could use that time. (Renso, 2026b)."
      },
      {
        "name": "The political frame",
        "description": "The political frame will include, when the two clinics will need the same mobile healthcare team at the same time. This will reveal the political side of this project. So, there is need to set the clear rules to avoid these types of conflicts."
      },
      {
        "name": "The symbolic frame",
        "description": "The symbolic frame shows the real actions, like listening to remote staff and addressing their real issues and solving those. So, this will build the trust. Pasting the logo on the website will not affect the relationship strengths with those remote clinics so, active listening will be needed. (Renso, 2026b)"
      }
    ],
    "champion": "The primary champion are the University of the Fraser Valley executives and Dr. Garry Fehr so that the cross-department decisions can be secured effectively.",
    "preInitiation": "Pre-Initiative include the key baselines like regional problems, deciding the spending ceiling, and the sponsors. Meanwhile, purchasing officer will uses the approved charter and then prepare the procurement packages within the budget.",
    "lifeCycleModel": "Spiral model",
    "lifeCycleDescription": "For the development of the research software, spiral model will be used. Each cycle will initiate with the decision, and one uncertainty will be decided. Cycles will evaluate weekly count delivery, forecast complexity, and tool performance during simulated shortages.",
    "processGroups": [
      {
        "name": "Initiating",
        "description": "this phase will confirm that lab has the necessary permissions to start developing the software and start other parts of the project."
      },
      {
        "name": "Planning",
        "description": "this phase will include the details of the work that needs to be done, how much it will cost and who will be responsible for it."
      },
      {
        "name": "Executing",
        "description": "in the phase, teams will be built and resources will be collected. Then development of the research software and installation of the sensors will be started."
      },
      {
        "name": "Monitoring and Controlling",
        "description": "this phase checks the progress of the project and prepare the status reports and progress reports. Then quality and other problems will be fixed and documented."
      },
      {
        "name": "Closing",
        "description": "in the phase the development of the project will be finished, and then final cost will be calculated, lessons learned from the mistakes will be recorded, the work will be transferred to the people who will finalize the project and its reports. (Renso, 2026b, Class 2 lecture slides)"
      }
    ],
    "reporting": {
      "progress": "Each team leader will submit the weekly progress report, and it will include the reporting date, completed milestones, next decision that will be taken and by who, and the deadline for that decision. (Renso, 2026)",
      "finance": "Meanwhile, the Finance department lead will send the spending report and comparison with the approved budget.",
      "status": "Along with this, a status reports will also be sent by all leads to get the status of the project at a specific time."
    },
    "changeControl": "This process includes recording the request of the stakeholder and reason behind that request. Then effects of that request will be reviewed on the cost, privacy, and the existing project work. After this, the change authority will approve the request and then update the scope, schedule, budget, testing and requirements and everyone will be informed.",
    "scopeAcceptance": "Then the completed work will be checked against the target set and then getting formal approval from the responsible person.",
    "swot": {
      "strengths": "The lab has a clear focus in solving the practical and real-life problems that are associated with the pandemic. Meanwhile, researchers and clinic managers take the better decisions by using that information about the staff schedules, supplies, and emergency planning. (Renso, 2026)",
      "weaknesses": "First one is that the lab is depends on the information that will be provided by other organizations. If many organizations will provide the data, then different reporting methods can create the inconsistent results, which will lead to errors. (Renso, 2026)",
      "opportunities": "Lab can use the same data and the research software access to other clinics in other regions and then each regions' clinic can make their own decisions based on the predictions by this software. (Renso, 2026)",
      "threats": "A participating clinic can leave the project and stop sending the data to UFV lab in between and that can slow down the progress. So, this project should prepare first the smaller version that will only collect the data from one clinic. (Renso, 2026)"
    },
    "qualityTopics": [
      {
        "name": "Quality Planning",
        "description": "It can be done by deciding what the report will contain and when it is needed, then setting the clear requirements, then assigning to someone who is responsible to check that whether these requirements are met or not."
      },
      {
        "name": "Quality Assurance",
        "description": "This is done by checking whether the team are following the correct procedures, then review the document and changes in it."
      },
      {
        "name": "Quality Control",
        "description": "By testing each software release, identify and record defects, and make sure the final product works correctly."
      },
      {
        "name": "Testing",
        "description": "This is done by checking the results of the calculations that it should produce the correct results, no duplicates of the records, no missing information, and then asking the clinic managers that the result reports are easy to process and read."
      },
      {
        "name": "Cost Of Quality",
        "description": "Cost can be decreased by training the staff to enter the information correctly, and review the quality of the information, fixing the errors before the report release and after the report release to improve further."
      },
      {
        "name": "Quality Incident Management",
        "description": "These quality related incidents will be recorded for future lessons, problems will be written in it and the cause of those problems, and then quality checklists will be made to set the future practices."
      }
    ],
    "hrTopics": [
      {
        "name": "Staffing and Workload Planning",
        "description": "In this plan, HR will determine which employees are needed and when and assigning too many tasks to one person will be avoided. Then HR will also decide that to complete certain phases of the project, where temporary workers will be needed."
      },
      {
        "name": "Employee Motivation",
        "description": "Time will be provided to employees to learn skills, recognize employees’ achievements and then appreciate them will increase their motivation. Then employees will be provided with predictable schedules and more backup employees so that workload should not increase on few employees."
      },
      {
        "name": "Communication",
        "description": "Project updates and other information will be shared among the employees of different departments via email and project management software like Microsoft Project."
      },
      {
        "name": "Project Handover",
        "description": "After the project will be completed then staff of the clinics will be trained to effectively send the data and process the reports generated by the research software."
      },
      {
        "name": "Project Closure",
        "description": "After confirming that whole work is done and reports are made then it will be finalized and project will be closed."
      }
    ]
  },
  "references": [
    "BC Centre for Disease Control. (2026b). Respiratory virus activity in BC: Weekly summary, November 19, 2026. https://www.bccdc.ca/health-professionals/data-reports/respiratory-virus-data",
    "BC Centre for Disease Control. (n.d.). Wastewater surveillance. https://www.bccdc.ca/our-services/programs/wastewater-surveillance",
    "British Columbia Ministry of Advanced Education, Skills and Training. (2020). Scientific discovery awaits students at new UBC facilities. Government of British Columbia. https://news.gov.bc.ca/releases/2020AEST0004-000062",
    "British Columbia Office of the Premier & British Columbia Ministry of Health. (2020). Investment brings new support to those most vulnerable to COVID-19 and communities where they live. Government of British Columbia. https://archive.news.gov.bc.ca/releases/news_releases_2017-2021/2020PREM0050-001694.htm",
    "Canadian Centre for Occupational Health and Safety. (2024). Fatigue. https://www.ccohs.ca/oshanswers/psychosocial/fatigue.html",
    "Fox, S. J., Kim, M., Meyers, L., Reich, N. G., & Ray, E. L. (2024). Optimizing disease outbreak forecast ensembles. Emerging Infectious Diseases, 30 (9), 1967–1969. https://doi.org/10.3201/eid3009.240026",
    "Freedom of Information and Protection of Privacy Act. (1996). R.S.B.C. 1996, c. 165, s. 36.3. BC Laws. https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96165_03",
    "Hamilton Board of Health. (2025). Feasibility of implementing wastewater surveillance (Report No. BOH25013). City of Hamilton. https://pub-hamilton.escribemeetings.com/filestream.ashx?DocumentId=457247",
    "Pfizer. (n.d.). Investigator sponsored research. https://www.pfizer.com/about/programs-policies/grants/investigator-sponsored-research",
    "Renso, K. (2026a). CIS 385 project management lecture slides. University of the Fraser Valley, Brightspace.",
    "Statistics Canada. (2022a). Population and dwelling counts: Canada and census divisions (Table 98-10-0007-01) [Data set]. https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810000701",
    "Treasury Board of Canada Secretariat. (2016). Guide to integrated risk management. Government of Canada. https://www.canada.ca/en/treasury-board-secretariat/corporate/risk-management/guide-integrated-risk-management.html",
    "Treasury Board of Canada Secretariat. (2018). Policy on cost-benefit analysis. Government of Canada. https://www.canada.ca/en/government/system/laws/developing-improving-federal-regulations/requirements-developing-managing-reviewing-regulations/policy-cost-benefit-analysis.html",
    "University of the Fraser Valley. (n.d.-b). Garry Fehr. https://www.ufv.ca/strategic-planning/process/stakeholder-group/fehr-garry.htm",
    "University of the Fraser Valley, Procurement Services. (n.d.). Guide to competitive bidding. https://www.ufv.ca/media/assets/secretariat/policies/Guide-to-Competitive-Bidding.pdf",
    "WorkBC. (n.d.). Data scientists. Government of British Columbia. https://www.workbc.ca/index.php/career-profiles/data-scientists",
    "World Health Organization. (2021). Roadmap to improve and ensure good indoor ventilation in the context of COVID-19. https://www.who.int/publications/i/item/9789240021280"
  ],
  "documentStructure": {
    "pageCount": 19,
    "wordCount": 4577,
    "headingCount": 50,
    "headingLevels": {
      "h1": 6,
      "h2": 17,
      "h3": 27
    },
    "tableCount": 5,
    "imageCount": 2,
    "hyperlinkCount": 66,
    "internalTocLinks": 50,
    "externalDocumentHyperlinks": 16,
    "listItemCount": 27,
    "referenceEntryCount": 17
  },
  "whatIfAssumptions": {
    "scopeToDurationMonthsPerScopePercent": null,
    "scheduleCompressionPremiumPercent": null,
    "accountScopeMapping": null,
    "riskImpactInputs": "User-entered only; no risk-specific dollar or delay values are in the document.",
    "note": "Values not specified in the Word document must be entered by the user and labelled assumption - not from the document."
  }
};

  global.PROJECT_DATA = PROJECT_DATA;
})(window);

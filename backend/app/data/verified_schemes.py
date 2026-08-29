from typing import List, Dict, Any

# Official, verified government schemes with deterministic eligibility criteria
VERIFIED_SCHEMES_SEED: List[Dict[str, Any]] = [
    {
        "id": "pm-kisan-001",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "short_description": "Central income support initiative providing ₹6,000 per year in 3 installments to landholding farmer families.",
        "detailed_description": "PM-KISAN is a Central Sector Scheme providing income support to all landholding farmers' families in the country to cultivate agricultural and allied activities as well as domestic needs. Financial benefit of ₹6,000/- per annum is provided in three equal installments of ₹2,000/- each directly into Aadhaar-seeded bank accounts.",
        "benefit_amount": "₹6,000 / year (3 installments)",
        "benefits": [
            "Direct income support of ₹6,000 per year transferred in 3 equal installments of ₹2,000",
            "100% Direct Benefit Transfer (DBT) into Aadhaar-seeded bank accounts",
            "Covers expenses for agricultural inputs, seeds, fertilizers, and domestic needs"
        ],
        "state": "Central",
        "category": "Agriculture & Direct Benefit Transfer",
        "official_source_url": "https://pmkisan.gov.in",
        "application_url": "https://pmkisan.gov.in/RegistrationFormNew.aspx",
        "domain": "pmkisan.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=pmkisan.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card with NPCI link",
            "Proof of Agricultural Land Ownership (ROR / RTC / Pahani / Khasra)",
            "Aadhaar-seeded Bank Account Passbook",
            "Active Mobile Number linked with Aadhaar"
        ],
        "active": True,
        "eligibility_criteria": [
            "Small or marginal farmer family with cultivable landholding",
            "Valid land ownership record (RTC/Pahani)",
            "NPCI Aadhaar-seeded active bank account"
        ]
    },
    {
        "id": "pm-kusum-b-006",
        "name": "PM-KUSUM Component B (Solar Agriculture Pump Subsidy)",
        "short_description": "Up to 90% capital subsidy on standalone solar agriculture pumps for small & marginal farmers.",
        "detailed_description": "Provides 30% Central Financial Assistance + 30% State Subsidy + 30% NABARD institutional loan for standalone solar pumps up to 7.5 HP for off-grid farmers.",
        "benefit_amount": "Up to 90% Capital Subsidy (Max ₹3,50,000)",
        "benefits": [
            "60% to 90% financial subsidy on 3HP to 7.5HP solar pumps",
            "Uninterrupted daytime irrigation without grid electricity costs",
            "Zero diesel fuel expenditure for off-grid farmers"
        ],
        "state": "Central",
        "category": "Solar Energy & Solar Pump Subsidies",
        "official_source_url": "https://pmkusum.mnre.gov.in",
        "application_url": "https://pmkusum.mnre.gov.in",
        "domain": "pmkusum.mnre.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=mnre.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Land RTC / Mutation copy / 7-12 Record",
            "Water Source Certificate (Borewell / Open Well)",
            "Bank Account Passbook",
            "No-Grid Electricity Pump Connection Declaration"
        ],
        "active": True,
        "eligibility_criteria": [
            "Individual farmers, Water User Associations, and FPOs",
            "Cultivable land with verified water source (borewell/well)",
            "No existing grid-connected electric pump connection"
        ]
    },
    {
        "id": "kcc-loan-007",
        "name": "Kisan Credit Card (KCC) 4% Concessional Crop Loan",
        "short_description": "Short-term crop cultivation loan up to ₹3 Lakh at an effective concessional interest rate of 4%.",
        "detailed_description": "Provides institutional credit to farmers for crop cultivation, post-harvest expenses, and maintenance of farm assets with 3% prompt repayment incentive.",
        "benefit_amount": "Collateral-free loan up to ₹1.6 Lakh (₹3 Lakh max at 4%)",
        "benefits": [
            "7% baseline interest rate with 3% prompt repayment incentive, reducing effective rate to 4%",
            "No collateral needed for loans up to ₹1,60,000",
            "Flexible repayment aligned with crop harvesting cycle"
        ],
        "state": "Central",
        "category": "Credit Support & Kisan Loans",
        "official_source_url": "https://agricoop.nic.in",
        "domain": "agricoop.nic.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=agricoop.nic.in&sz=64",
        "required_documents": [
            "KCC Application Form",
            "Aadhaar Card & PAN Card",
            "Land Record (RTC / Pahani / Patta / Cultivation Certificate)",
            "Bank Account Passbook & 2 Passport Photos"
        ],
        "active": True,
        "eligibility_criteria": [
            "All owner cultivators, tenant farmers, oral lessees, and sharecroppers",
            "Self Help Groups or Joint Liability Groups of farmers"
        ]
    },
    {
        "id": "pmksy-drip-008",
        "name": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop)",
        "short_description": "55% to 90% financial assistance for micro-irrigation systems (drip and sprinkler).",
        "detailed_description": "Promotes micro-irrigation technologies to enhance water use efficiency and farm productivity for precision agriculture.",
        "benefit_amount": "55% to 90% Subsidy on Drip & Sprinkler Units",
        "benefits": [
            "55% subsidy for small and marginal farmers, 45% for other farmers",
            "State top-up in Karnataka extends assistance up to 90%",
            "Saves up to 40% irrigation water and increases crop yield by 30%"
        ],
        "state": "Central",
        "category": "Agriculture & Irrigation Subsidies",
        "official_source_url": "https://pmksy.gov.in",
        "domain": "pmksy.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=pmksy.gov.in&sz=64",
        "required_documents": [
            "Land RTC / Pahani",
            "Aadhaar Card",
            "Soil & Water Testing Report",
            "Bank Passbook & Electricity Bill"
        ],
        "active": True,
        "eligibility_criteria": [
            "Farmers possessing cultivable land with assured water source",
            "Preference given to SC/ST and women farmers"
        ]
    },
    {
        "id": "pmfby-crop-003",
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY Crop Insurance)",
        "short_description": "Comprehensive risk coverage against crop loss due to non-preventable natural risks at 1.5% to 2% premium.",
        "detailed_description": "Provides financial support to farmers suffering crop loss/damage arising out of unforeseen natural calamities like drought, flood, pests, and unseasonal rains.",
        "benefit_amount": "Full Sum Insured Claim Settlement for Crop Failure",
        "benefits": [
            "Nominal premium: 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops",
            "Direct claim settlement via Aadhaar-linked DBT account",
            "Covers prevented sowing, mid-season adversity, and post-harvest localized losses"
        ],
        "state": "Central",
        "category": "Crop Insurance & Subsidies",
        "official_source_url": "https://pmfby.gov.in",
        "application_url": "https://pmfby.gov.in",
        "domain": "pmfby.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=pmfby.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Land RTC / Pahani / Sowing Certificate",
            "Crop Sowing Declaration / Village Accountant Certificate",
            "Bank Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "All farmers growing notified crops in notified areas",
            "Includes loanee and non-loanee farmers, sharecroppers, and tenant farmers"
        ]
    },
    {
        "id": "pmay-g-002",
        "name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "short_description": "Financial assistance of ₹1.20 Lakh to ₹1.30 Lakh for construction of pucca house in rural areas.",
        "detailed_description": "Aims to provide pucca houses with basic amenities to all rural families living in kutcha or dilapidated houses.",
        "benefit_amount": "₹1,20,000 (Plain) / ₹1,30,000 (Hilly)",
        "benefits": [
            "Direct grant of ₹1.2 Lakh in plain areas, ₹1.3 Lakh in hilly areas",
            "Additional 90/95 days of unskilled labor wage under MGNREGS",
            "₹12,000 assistance for toilet construction under Swachh Bharat Mission"
        ],
        "state": "Central",
        "category": "Rural Housing & Infrastructure",
        "official_source_url": "https://pmayg.nic.in",
        "domain": "pmayg.nic.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=pmayg.nic.in&sz=64",
        "required_documents": [
            "Aadhaar Card of all household members",
            "Bank Account Passbook",
            "MGNREGA Job Card Number",
            "SECC / Awas+ Household Verification Reference"
        ],
        "active": True,
        "eligibility_criteria": [
            "Families without shelter or living in kutcha houses",
            "Verified in SECC / Awas+ rural housing list"
        ]
    },
    {
        "id": "pm-jay-004",
        "name": "Ayushman Bharat PM-JAY (₹5 Lakh Free Health Cover)",
        "short_description": "Cashless secondary and tertiary hospitalization cover of up to ₹5 Lakh per family per year.",
        "detailed_description": "World's largest health assurance scheme providing free secondary and tertiary inpatient care across 27,000+ empaneled government and private hospitals.",
        "benefit_amount": "₹5,00,000 / year Cashless Hospitalization",
        "benefits": [
            "₹5 Lakh cashless treatment cover per family per year",
            "Covers 1,949 medical procedures including surgeries, ICU, diagnostics, and medicines",
            "No family size or age limit restriction"
        ],
        "state": "Central",
        "category": "Health & Social Welfare",
        "official_source_url": "https://pmjay.gov.in",
        "application_url": "https://beneficiary.nha.gov.in",
        "domain": "pmjay.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=nha.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Ration Card (BPL / Antyodaya / Priority Household)",
            "Active Mobile Number"
        ],
        "active": True,
        "eligibility_criteria": [
            "Households identified under SECC 2011 criteria",
            "Active BPL or Antyodaya Ration card holders"
        ]
    },
    {
        "id": "smam-mechanization-009",
        "name": "Sub-Mission on Agricultural Mechanization (SMAM - Tractor Subsidy)",
        "short_description": "40% to 50% financial subsidy on purchase of tractors, rotavators, power tillers, and farm machinery.",
        "detailed_description": "Promotes agricultural mechanization among small and marginal farmers to offset high labor costs and increase farm productivity through subsidized machinery.",
        "benefit_amount": "40% to 50% Subsidy on Farm Equipment (Up to ₹2,50,000)",
        "benefits": [
            "50% subsidy for SC/ST, women, and small/marginal farmers; 40% for general farmers",
            "Covers tractors, power tillers, reapers, seed drills, and sprayers",
            "Direct subsidy credit through DBT"
        ],
        "state": "Central",
        "category": "Agricultural Machinery & Subsidies",
        "official_source_url": "https://agrimachinery.nic.in",
        "domain": "agrimachinery.nic.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=agricoop.nic.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Land RTC / Pahani",
            "Caste Certificate (for SC/ST concession)",
            "Bank Passbook",
            "Equipment Quotation from Authorized Dealer"
        ],
        "active": True,
        "eligibility_criteria": [
            "Landholding farmers registered in state farmer database",
            "Has not availed mechanization subsidy on the same equipment in the last 5 years"
        ]
    },
    {
        "id": "pkvy-organic-010",
        "name": "Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)",
        "short_description": "Financial assistance of ₹50,000 per hectare for 3 years to adopt certified organic farming clusters.",
        "detailed_description": "Promotes chemical-free organic farming through cluster approach with Participatory Guarantee System (PGS) certification, soil health inputs, and value addition.",
        "benefit_amount": "₹50,000 / hectare / 3 years",
        "benefits": [
            "₹31,000/ha transferred directly via DBT for organic seeds, bio-fertilizers, and bio-pesticides",
            "₹8,800/ha for post-harvest packaging, branding, and marketing",
            "Free PGS-India organic certification"
        ],
        "state": "Central",
        "category": "Organic Farming & Soil Health",
        "official_source_url": "https://pgsindia-ncof.gov.in",
        "domain": "gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Land Record (RTC / Pahani)",
            "Cluster Group Registration Details",
            "Bank Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Farmers forming organic clusters of minimum 20 hectares / 50 farmers",
            "Commitment to chemical-free agriculture for 3 consecutive years"
        ]
    },
    {
        "id": "pm-matsya-011",
        "name": "Pradhan Mantri Matsya Sampada Yojana (PMMSY - Fisheries)",
        "short_description": "40% to 60% capital subsidy for aquaculture ponds, biofloc units, fish feed mills, and refrigerated vehicles.",
        "detailed_description": "Flagship scheme for focused and sustainable development of the fisheries sector covering fish farming infrastructure, disease diagnostics, and value chain development.",
        "benefit_amount": "40% to 60% Financial Subsidy (Up to ₹15 Lakh)",
        "benefits": [
            "60% financial assistance for women, SC, and ST beneficiaries; 40% for other categories",
            "Covers freshwater aquaculture, re-circulatory aquaculture systems (RAS), and biofloc units",
            "Subsidized insulated three-wheelers and two-wheelers for fish marketing"
        ],
        "state": "Central",
        "category": "Fisheries & Allied Sectors",
        "official_source_url": "https://pmmsy.dof.gov.in",
        "domain": "dof.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=dof.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Land Ownership / Lease Agreement for Water Body",
            "Detailed Project Report (DPR)",
            "Bank Passbook & Caste Certificate (if applicable)"
        ],
        "active": True,
        "eligibility_criteria": [
            "Fishers, fish farmers, fish workers, SHGs, and Fisheries Cooperatives",
            "Own or leased land/water body suitable for fish culture"
        ]
    },
    {
        "id": "nlm-dairy-012",
        "name": "National Livestock Mission (NLM - Dairy & Poultry Subsidy)",
        "short_description": "50% capital subsidy up to ₹50 Lakh for goat, sheep, piggery, and poultry farm enterprises.",
        "detailed_description": "Fosters entrepreneurship in livestock sector by providing 50% capital subsidy on breed multiplication farms, poultry hatcheries, and feed processing units.",
        "benefit_amount": "50% Capital Subsidy (Up to ₹50,00,000)",
        "benefits": [
            "50% back-ended capital subsidy on capital investment",
            "Covers 100-500 animal sheep/goat breeding farms and commercial poultry units",
            "Subsidized fodder seed production and silage making units"
        ],
        "state": "Central",
        "category": "Animal Husbandry & Dairy",
        "official_source_url": "https://nlm.udyamimitra.in",
        "domain": "nlm.udyamimitra.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=udyamimitra.in&sz=64",
        "required_documents": [
            "Aadhaar Card & PAN Card",
            "Land Title / Registered Lease Deed (min 10 years)",
            "Bank Loan Sanction Letter (for bank-linked projects)",
            "Detailed Project Report (DPR) by certified veterinarian"
        ],
        "active": True,
        "eligibility_criteria": [
            "Individual farmers, FPOs, JLGs, SHGs, and Section 8 companies",
            "Adequate land and water facilities for livestock rearing"
        ]
    },
    {
        "id": "raitha-vidya-005",
        "name": "Karnataka Raitha Vidya Nidhi Scholarship",
        "short_description": "Annual educational scholarship of ₹2,500 to ₹11,000 for children of farmers in Karnataka.",
        "detailed_description": "Provides annual scholarship directly to bank accounts of farmer children pursuing higher education after 10th standard.",
        "benefit_amount": "₹2,500 to ₹11,000 / year based on course",
        "benefits": [
            "Direct DBT scholarship into student bank account",
            "Covers PUC, ITI, Diploma, Degree, Postgraduate, and Professional medical/engineering degrees",
            "Female students receive additional incentive amount"
        ],
        "state": "Karnataka",
        "category": "Education & Scholarships",
        "official_source_url": "https://raitamitra.karnataka.gov.in",
        "domain": "karnataka.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64",
        "required_documents": [
            "Farmer FID Number / Land RTC",
            "Student Aadhaar Card",
            "College Admission Fee Receipt / Study Certificate",
            "Bank Passbook seeded with Aadhaar"
        ],
        "active": True,
        "eligibility_criteria": [
            "Child of a registered farmer in Karnataka with valid FID / RTC",
            "Enrolled in recognized institution after SSLC / 10th class"
        ]
    },
    {
        "id": "ganga-kalyana-013",
        "name": "Karnataka Ganga Kalyana Scheme (Free Borewell & Pump)",
        "short_description": "100% free borewell drilling and pump energization for SC, ST, OBC, and Minority small farmers.",
        "detailed_description": "Provides dedicated irrigation facilities to small and marginal farmers belonging to SC/ST and backward classes by drilling borewells, providing submersible pumps, and energizing power connections with 100% subsidy.",
        "benefit_amount": "100% Free Borewell + Pump (Value ₹3.5 Lakh to ₹4.5 Lakh)",
        "benefits": [
            "100% financial subsidy on borewell drilling, casing pipe, and pump installation",
            "Free dedicated electric line connection through ESCOM",
            "Transforms dry land into assured irrigated agricultural land"
        ],
        "state": "Karnataka",
        "category": "Agriculture & Irrigation Subsidies",
        "official_source_url": "https://kmdc.karnataka.gov.in",
        "domain": "karnataka.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64",
        "required_documents": [
            "Land RTC / Pahani (1.20 to 5.00 acres)",
            "Caste Certificate (SC / ST / OBC / Category-1 / 2A / 3A)",
            "Income Certificate (Annual income < ₹2,00,000 rural)",
            "Aadhaar Card",
            "Bank Account Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Small or marginal farmer belonging to SC/ST/OBC/Minority community",
            "Landholding between 1.20 and 5.00 acres without prior government borewell benefit",
            "Annual family income within prescribed limit"
        ]
    },
    {
        "id": "krishi-bhagya-014",
        "name": "Karnataka Krishi Bhagya Scheme (Farm Ponds & Polyhouses)",
        "short_description": "Up to 90% subsidy for constructing farm ponds (Krishi Honda), polythene lining, diesel pump sets, and shade nets.",
        "detailed_description": "Rainwater harvesting and dryland farming initiative providing subsidized farm ponds (Krishi Honda) with polythene lining to store rainwater for protective irrigation in rain-fed regions.",
        "benefit_amount": "80% to 90% Subsidy on Farm Pond & Micro-irrigation",
        "benefits": [
            "90% subsidy for SC/ST farmers, 80% for general farmers",
            "Covers pond digging, polythene sheet lining, diesel pumpset, and micro-sprinklers",
            "Ensures protective irrigation during dry spells"
        ],
        "state": "Karnataka",
        "category": "Water Harvesting & Agriculture",
        "official_source_url": "https://raitamitra.karnataka.gov.in",
        "domain": "karnataka.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64",
        "required_documents": [
            "Farmer FID Number / Land RTC",
            "Aadhaar Card",
            "Caste & Income Certificate",
            "Bank Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Farmers possessing land in notified rain-fed taluks of Karnataka",
            "Minimum 1 acre cultivable land holding"
        ]
    },
    {
        "id": "yashaswini-health-015",
        "name": "Karnataka Yashaswini Health Insurance Scheme",
        "short_description": "Cashless health insurance cover up to ₹5 Lakh for members of rural cooperative societies in Karnataka.",
        "detailed_description": "Re-launched health protection scheme for members of rural cooperative societies and their families, covering 1,650+ surgical procedures cashless at network hospitals.",
        "benefit_amount": "₹5,00,000 / year Cashless Treatment",
        "benefits": [
            "Cashless treatment up to ₹5 Lakh per family per year",
            "Covers 1,650 surgical and inpatient medical procedures",
            "Low annual contribution: ₹500 for rural family of 4 (₹1,000 for urban)"
        ],
        "state": "Karnataka",
        "category": "Health & Social Welfare",
        "official_source_url": "https://yashaswini.karnataka.gov.in",
        "domain": "karnataka.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64",
        "required_documents": [
            "Primary Agricultural Credit Cooperative Society (PACS) Membership Certificate",
            "Aadhaar Card of all family members",
            "Ration Card",
            "Nominee Bank Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Active member of a registered Rural Cooperative Society / Milk Union for at least 3 months",
            "Resident of Karnataka"
        ]
    },
    {
        "id": "gruha-lakshmi-016",
        "name": "Karnataka Gruha Lakshmi Scheme (₹2,000 Monthly Woman Head)",
        "short_description": "Direct financial assistance of ₹2,000 per month to the woman head of household in Karnataka.",
        "detailed_description": "Flagship DBT guarantee scheme providing unconditional monthly financial assistance of ₹2,000 directly into the bank accounts of women heads of households.",
        "benefit_amount": "₹2,000 / month (₹24,000 / year DBT)",
        "benefits": [
            "Direct monthly DBT transfer of ₹2,000 into woman's Aadhaar-seeded bank account",
            "Improves household economic resilience and financial autonomy",
            "Zero intermediaries with direct bank crediting"
        ],
        "state": "Karnataka",
        "category": "Women & Child Welfare",
        "official_source_url": "https://sevasindhu.karnataka.gov.in",
        "domain": "karnataka.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=karnataka.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card of Woman Head",
            "Husband's Aadhaar Card (if married)",
            "Ration Card (APL / BPL / Antyodaya showing female as head)",
            "Aadhaar-seeded NPCI Bank Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Woman recognized as Head of Family in valid Ration Card",
            "Neither woman nor husband pays Income Tax or GST"
        ]
    },
    {
        "id": "pm-vishwakarma-017",
        "name": "PM Vishwakarma Scheme (Artisans & Craftsmen Support)",
        "short_description": "Skill training with ₹500/day stipend, ₹15,000 toolkit voucher, and collateral-free loans up to ₹3 Lakh at 5% interest.",
        "detailed_description": "Central initiative to support traditional artisans and craftspeople working with hands and tools across 18 trades including blacksmiths, carpenters, potters, and cobblers.",
        "benefit_amount": "₹15,000 Toolkit Grant + ₹3 Lakh Loan @ 5%",
        "benefits": [
            "₹15,000 e-voucher for modern toolkits",
            "Collateral-free credit: ₹1 Lakh (Tranche 1) and ₹2 Lakh (Tranche 2) at concessional 5% interest rate",
            "5-7 days basic skill training with ₹500/day stipend and PM Vishwakarma Certificate & ID Card"
        ],
        "state": "Central",
        "category": "Artisans & Micro Enterprises",
        "official_source_url": "https://pmvishwakarma.gov.in",
        "domain": "pmvishwakarma.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=msme.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Bank Account Passbook",
            "Ration Card",
            "Skill / Trade Declaration"
        ],
        "active": True,
        "eligibility_criteria": [
            "Traditional artisan or craftsman working in one of the 18 notified family trades",
            "Minimum age 18 years; not availed similar PMEGP/PM SVANidhi loans in the last 5 years"
        ]
    },
    {
        "id": "pm-svanidhi-018",
        "name": "PM SVANidhi Scheme (Micro-Credit for Street Vendors)",
        "short_description": "Working capital micro-loans of ₹10,000, ₹20,000, and ₹50,000 with 7% interest subsidy for street vendors.",
        "detailed_description": "Special micro-credit facility providing collateral-free working capital loans to street vendors to resume their livelihoods with digital transaction cashback rewards.",
        "benefit_amount": "Up to ₹50,000 Working Capital Loan @ 7% Interest Subsidy",
        "benefits": [
            "Collateral-free credit: ₹10,000 (1st loan), ₹20,000 (2nd loan), and ₹50,000 (3rd loan)",
            "7% annual interest subsidy credited quarterly directly to bank account",
            "Up to ₹1,200 cashback per year for digital transactions"
        ],
        "state": "Central",
        "category": "Micro Credit & Livelihoods",
        "official_source_url": "https://pmsvanidhi.mohua.gov.in",
        "domain": "pmsvanidhi.mohua.gov.in",
        "favicon_url": "https://www.google.com/s2/favicons?domain=mohua.gov.in&sz=64",
        "required_documents": [
            "Aadhaar Card",
            "Certificate of Vending / Letter of Recommendation (LoR) from Urban Local Body",
            "Bank Account Passbook"
        ],
        "active": True,
        "eligibility_criteria": [
            "Street vendors vending in urban and peri-urban areas",
            "Possesses Certificate of Vending or Urban Local Body survey ID"
        ]
    }
]

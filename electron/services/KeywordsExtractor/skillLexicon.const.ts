/**
 * Known hard skills, tools, methodologies and certifications.
 * Format: "Canonical display|alias|alias". Matching is case and accent insensitive, and
 * multi-word entries are matched as a whole (even across stop words, e.g. "Ruby on Rails").
 * Matched terms are protected from stop word / POS filtering and get a specificity boost.
 */
export const SKILL_LEXICON: string[] = [
    // Languages
    'JavaScript|js|ecmascript', 'TypeScript|ts', 'Python', 'Java', 'Kotlin', 'Scala', 'Go|golang', 'Rust',
    'C', 'C++|cpp', 'C#|csharp|c sharp', 'Objective-C', 'Swift', 'Ruby', 'PHP', 'Perl', 'R', 'MATLAB',
    'Julia', 'Dart', 'Elixir', 'Erlang', 'Haskell', 'Clojure', 'F#', 'Lua', 'Groovy', 'COBOL', 'Fortran',
    'VBA', 'Bash', 'Shell|shell scripting', 'PowerShell', 'SQL', 'PL/SQL|plsql', 'T-SQL|tsql', 'NoSQL',
    'HTML|html5', 'CSS|css3', 'Sass|scss', 'Less', 'GraphQL', 'Solidity', 'Assembly', 'ABAP', 'Apex',

    // Front-end
    'React|react.js|reactjs', 'React Native', 'Next.js|nextjs', 'Vue.js|vue|vuejs', 'Nuxt.js|nuxt',
    'Angular|angularjs', 'Svelte', 'jQuery', 'Redux', 'Tailwind CSS|tailwind', 'Bootstrap', 'Material UI|mui',
    'Webpack', 'Vite', 'Babel', 'Storybook', 'Three.js', 'D3.js|d3', 'Electron', 'Flutter', 'Ionic', 'Xamarin',
    'SwiftUI', 'Jetpack Compose', 'WebAssembly|wasm', 'Web Components', 'Accessibility|a11y', 'WCAG',

    // Back-end & frameworks
    'Node.js|nodejs|node js', 'Express|express.js|expressjs', 'NestJS|nest.js', 'Deno', 'Bun', 'Django',
    'Flask', 'FastAPI', 'Spring|spring framework', 'Spring Boot', 'Hibernate', '.NET|dotnet|dot net',
    '.NET Core|dotnet core', 'ASP.NET|asp.net core', 'Entity Framework', 'Ruby on Rails|rails', 'Laravel',
    'Symfony', 'Phoenix', 'gRPC', 'REST|rest api|rest apis|restful|restful api|api rest|apis rest', 'SOAP', 'WebSockets|websocket',
    'Microservices|microservice|micro-services', 'Event-driven architecture|event driven architecture',
    'Serverless', 'OAuth|oauth2', 'OpenID Connect|oidc', 'JWT', 'SAML', 'API design', 'OpenAPI|swagger',

    // Data stores & messaging
    'PostgreSQL|postgres', 'MySQL', 'MariaDB', 'SQLite', 'Oracle', 'SQL Server|mssql|microsoft sql server',
    'MongoDB|mongo', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch|elastic search', 'OpenSearch',
    'Neo4j', 'CouchDB', 'Firebase', 'Supabase', 'Snowflake', 'BigQuery', 'Redshift', 'Databricks',
    'Kafka|apache kafka', 'RabbitMQ', 'ActiveMQ', 'NATS', 'Pub/Sub', 'SQS', 'SNS', 'Kinesis',
    'Prisma', 'Sequelize', 'TypeORM', 'SQLAlchemy', 'ORM',

    // Cloud, infra & DevOps
    'AWS|amazon web services', 'Azure|microsoft azure', 'GCP|google cloud|google cloud platform',
    'AWS Lambda|lambda', 'EC2', 'S3', 'ECS', 'EKS', 'CloudFormation', 'Azure DevOps', 'Heroku', 'Vercel',
    'Netlify', 'Cloudflare', 'OpenShift', 'Docker', 'Kubernetes|k8s', 'Helm', 'Terraform', 'Pulumi',
    'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Jenkins', 'GitLab CI|gitlab ci/cd', 'GitHub Actions',
    'CircleCI', 'Travis CI', 'Argo CD|argocd', 'CI/CD|ci cd|cicd|continuous integration|continuous delivery|continuous deployment',
    'DevOps', 'DevSecOps', 'SRE|site reliability engineering', 'Infrastructure as Code|iac', 'GitOps',
    'Linux', 'Unix', 'Windows Server', 'Nginx', 'Apache', 'Prometheus', 'Grafana', 'Datadog', 'Splunk',
    'New Relic', 'ELK|elk stack', 'OpenTelemetry', 'Observability', 'Monitoring', 'Networking', 'TCP/IP',
    'DNS', 'HTTP', 'Load balancing', 'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Jira', 'Confluence',

    // Testing & quality
    'Unit testing|unit tests|tests unitaires|test unitaire', "Integration testing|integration tests|tests d'integration|test d'integration", 'End-to-end testing|e2e|e2e testing',
    'TDD|test-driven development|test driven development', 'BDD|behavior-driven development', 'Jest',
    'Vitest', 'Mocha', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'pytest', 'Cucumber', 'Postman',
    'SonarQube', 'Code review|code reviews|revues de code|revue de code', 'QA|quality assurance', 'Test automation|automated testing',
    'Performance testing', 'Load testing',

    // Data, AI & ML
    'Machine Learning|ml', 'Deep Learning', 'Artificial Intelligence|ai|intelligence artificielle',
    'NLP|natural language processing', 'Computer Vision', 'Generative AI|genai|gen ai', 'LLM|llms|large language models',
    'RAG|retrieval augmented generation', 'Prompt engineering', 'MLOps', 'Data Science', 'Data Engineering',
    'Data Analysis|data analytics|analyse de donnees|analyse des donnees', 'Data Visualization|data viz', 'Dashboards|dashboard|tableaux de bord|tableau de bord', 'Data Modeling|data modelling',
    'Data Warehousing|data warehouse', 'Data Lake', 'Data Governance', 'Data Quality', 'Big Data', 'ETL', 'ELT',
    'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn|sklearn', 'Pandas', 'NumPy', 'SciPy', 'Jupyter',
    'Spark|apache spark|pyspark', 'Hadoop', 'Airflow|apache airflow', 'dbt', 'Hugging Face', 'LangChain',
    'OpenAI', 'Statistics|statistiques', 'A/B testing', 'Power BI|powerbi', 'Tableau', 'Looker', 'Qlik',
    'Excel|microsoft excel', 'Google Analytics', 'SAS', 'SPSS', 'Stata',

    // Security
    'Cybersecurity|cyber security|cybersecurite', 'Penetration testing|pentest|pentesting', 'OWASP',
    'SIEM', 'IAM|identity and access management', 'Zero Trust', 'Encryption', 'PKI', 'SOC 2|soc2',
    'ISO 27001', 'GDPR|rgpd', 'HIPAA', 'PCI DSS', 'Vulnerability management', 'Threat modeling',

    // Architecture & practices
    'System design', 'Distributed systems', 'Software architecture', 'Clean architecture', 'Domain-driven design|ddd',
    'Design patterns', 'Object-oriented programming|oop', 'Functional programming', 'SOLID', 'Clean code',
    'Scalability', 'High availability', 'Caching', 'Concurrency', 'Multithreading', 'Algorithms', 'Data structures',
    'Embedded systems|systemes embarques', 'RTOS', 'IoT|internet of things', 'Blockchain', 'Web3',
    'Full-stack|full stack|fullstack', 'Front-end|frontend|front end', 'Back-end|backend|back end',
    'Mobile development', 'iOS', 'Android', 'SaaS', 'ERP', 'CRM', 'UI/UX|ux/ui', 'UX', 'UI', 'Figma', 'Sketch',
    'Adobe XD', 'Photoshop', 'Illustrator', 'InDesign', 'Wireframing', 'Prototyping', 'User research',

    // Methodologies & management
    'Agile|agilite|agile methodology|agile methodologies|methodes agiles|methode agile|methodologie agile', 'Scrum', 'Kanban', 'SAFe', 'Lean', 'Six Sigma', 'Waterfall', 'Scrum Master', 'Product Owner',
    'Project management|gestion de projet', 'Product management', 'Change management|conduite du changement',
    'Risk management|gestion des risques', 'Stakeholder management', 'Budgeting', 'Forecasting',
    'Business analysis', 'Requirements gathering', 'Process improvement', 'Continuous improvement', 'ITIL',
    'PRINCE2', 'OKR|okrs', 'KPI|kpis', 'Roadmap|roadmapping', 'Pair programming', 'Mentoring', 'Technical leadership',

    // Business tools & domains
    'SAP', 'Salesforce', 'HubSpot', 'Workday', 'Dynamics 365|microsoft dynamics', 'ServiceNow', 'Zendesk',
    'SharePoint', 'Microsoft 365|office 365', 'Google Workspace', 'Notion', 'Trello', 'Asana', 'Slack',
    'SEO', 'SEM', 'Google Ads', 'Content marketing', 'Digital marketing|marketing digital', 'CRM strategy',
    'Financial modeling|financial modelling|financial models|financial model', 'Accounting|comptabilite', 'Auditing|audit', 'IFRS', 'GAAP',
    'Supply chain', 'Logistics|logistique', 'Procurement', 'E-commerce|ecommerce', 'Fintech', 'Payments',
    'Compliance|conformite', 'AML|anti-money laundering', 'KYC', 'Big Four',

    // Spoken languages
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Arabic', 'Japanese',
    'Anglais', 'Français|francais', 'Espagnol', 'Allemand', 'Italien', 'Bilingue|bilingual',

    // Certifications & degrees
    'PMP', 'CPA', 'CFA', 'CISSP', 'CISM', 'CEH', 'CCNA', 'AWS Certified', 'Azure Certified', 'CKA',
    'PSM', 'CSM', 'TOEIC', 'TOEFL', 'MBA', 'PhD|ph.d|doctorate', "Bachelor|bachelor's|bachelors|baccalaureat",
    "Master|master's|masters", 'Computer Science|informatique', 'Software Engineering|genie logiciel',
    'Electrical Engineering', 'Mechanical Engineering',
];

/**
 * Single-word lexicon entries that are also everyday words.
 * 'capitalized': only accepted when written with a leading capital ("Go", "Spring", "Rust").
 * 'exact': only accepted with the canonical casing ("REST", "SOLID", "SAFe").
 */
export const AMBIGUOUS_SKILLS: Record<string, 'capitalized' | 'exact'> = {
    go: 'capitalized', c: 'capitalized', r: 'capitalized', express: 'capitalized', spring: 'capitalized',
    swift: 'capitalized', rust: 'capitalized', shell: 'capitalized', assembly: 'capitalized', oracle: 'capitalized',
    chef: 'capitalized', puppet: 'capitalized', notion: 'capitalized', slack: 'capitalized', sketch: 'capitalized',
    bun: 'capitalized', spark: 'capitalized', apache: 'capitalized', lambda: 'capitalized', rails: 'capitalized',
    julia: 'capitalized', dart: 'capitalized', phoenix: 'capitalized', electron: 'capitalized', ionic: 'capitalized',
    tableau: 'capitalized', jest: 'capitalized', mocha: 'capitalized', cucumber: 'capitalized', helm: 'capitalized', lean: 'capitalized',
    master: 'capitalized', bachelor: 'capitalized', ts: 'capitalized', js: 'capitalized',
    ai: 'capitalized', ml: 'capitalized', ui: 'capitalized', ux: 'capitalized', qa: 'capitalized', iac: 'capitalized',
    less: 'exact', rest: 'exact', solid: 'exact', safe: 'exact', sas: 'exact',
};

/**
 * Generic corporate vocabulary: verbs, soft qualifiers and role nouns that describe the job
 * rather than the skills. They are treated as phrase delimiters, never as keywords.
 */
export const GENERIC_TERMS = {
    en: [
        // verbs (base forms; inflections are caught by POS tagging)
        'develop', 'developing', 'maintain', 'maintaining', 'optimize', 'optimise', 'optimizing', 'implement',
        'implementing', 'build', 'building', 'manage', 'managing', 'support', 'supporting', 'improve', 'improving',
        'deliver', 'delivering', 'drive', 'driving', 'ensure', 'ensuring', 'collaborate', 'collaborating',
        'communicate', 'lead', 'leading', 'own', 'owning', 'help', 'helping', 'create', 'creating', 'write',
        'writing', 'contribute', 'contributing', 'participate', 'join', 'grow', 'growing', 'enable', 'provide',
        'providing', 'identify', 'define', 'deploy', 'deploying', 'enhance', 'leverage', 'leveraging', 'use', 'using',
        'utilize', 'apply', 'perform', 'review', 'coordinate', 'partner', 'thrive', 'shape', 'solve', 'solving',
        'troubleshoot', 'troubleshooting', 'debug', 'debugging', 'analyze', 'analyse', 'analyzing', 'document',
        'plan', 'execute', 'scale', 'ship', 'shipping', 'mentor', 'learn', 'learning to', 'looking', 'seeking',
        'including', 'etc', 'e.g', 'i.e', 'eg', 'ie',
        // qualifiers
        'strong', 'excellent', 'good', 'great', 'solid', 'proven', 'deep', 'hands-on', 'demonstrated', 'relevant',
        'related', 'similar', 'equivalent', 'preferred', 'required', 'desired', 'desirable', 'ideal', 'ideally',
        'plus', 'bonus', 'nice', 'must', 'minimum', 'least', 'senior', 'junior', 'mid-level', 'intermediate',
        'advanced', 'expert', 'highly', 'high-quality', 'quality', 'scalable', 'robust', 'reliable', 'efficient',
        'innovative', 'modern', 'complex', 'various', 'multiple', 'key', 'core', 'critical', 'successful',
        'fast-paced', 'dynamic', 'passionate', 'motivated', 'detail-oriented', 'self-starter', 'cross-functional',
        'best', 'new', 'existing', 'large', 'small', 'high', 'low', 'daily', 'day-to-day', 'end', 'well',
        'effectively', 'closely', 'independently', 'proficient', 'proficiency', 'familiar', 'familiarity',
        'comfortable', 'able', 'ability', 'abilities', 'understanding', 'knowledge', 'experience', 'experienced',
        'expertise', 'background', 'exposure', 'track record', 'skills', 'skill', 'competencies',
        // role, company & context nouns
        'developer', 'developers', 'engineer', 'engineers', 'specialist', 'consultant', 'analyst', 'architect',
        'role', 'position', 'job', 'opportunity', 'opportunities', 'candidate', 'candidates', 'company', 'companies',
        'team', 'teams', 'teammates', 'colleagues', 'client', 'clients', 'customer', 'customers', 'user', 'users',
        'stakeholders', 'business', 'environment', 'culture', 'mission', 'vision', 'values', 'benefits', 'salary',
        'compensation', 'perks', 'office', 'hybrid', 'remote', 'onsite', 'on-site', 'location', 'year', 'years',
        'month', 'months', 'week', 'weeks', 'day', 'days', 'time', 'full-time', 'part-time', 'responsibilities',
        'requirements', 'qualifications', 'duties', 'tasks', 'solutions', 'solution', 'products', 'product features',
        'features', 'feature', 'systems', 'services', 'applications', 'application', 'software', 'tools', 'tool',
        'technologies', 'technology', 'technical', 'platform', 'platforms', 'projects', 'project', 'work', 'people',
        'world', 'industry', 'field', 'area', 'areas', 'part', 'ways', 'way', 'thing', 'things', 'level', 'levels',
        'degree', 'communication', 'teamwork', 'attitude', 'passion', 'curiosity', 'ownership', 'impact', 'growth',
        'success', 'problem', 'problems', 'challenges', 'ideas', 'insights', 'goals', 'needs', 'initiatives',
        'employer', 'employees', 'development', 'designation', 'fluent', 'fluency', 'annual', 'monthly',
        'quarterly', 'yearly', 'weekly', 'scientist', 'scientists', 'equal', 'diversity', 'inclusion', 'applicants', 'applicant', 'range', 'base',
    ],
    fr: [
        'developper', 'maintenir', 'optimiser', 'implementer', 'mettre en place', 'concevoir', 'gerer', 'assurer',
        'participer', 'contribuer', 'collaborer', 'accompagner', 'piloter', 'realiser', 'rediger', 'garantir',
        'proposer', 'analyser', 'ameliorer', 'integrer', 'livrer', 'deployer', 'animer', 'suivre', 'utiliser',
        'maitriser', 'rejoindre', 'travailler', 'etre', 'serait', 'souhaite', 'souhaitee', 'appreciee', 'appreciees',
        'apprecie', 'requise', 'requises', 'exige', 'exigee', 'obligatoire', 'fort', 'forte', 'bonne', 'bon',
        'excellente', 'excellent', 'solides', 'minimum', 'moins', 'idealement', 'plus', 'atout', 'senior', 'junior',
        'confirme', 'confirmee', 'experimente', 'experimentee', 'autonome', 'rigoureux', 'rigoureuse', 'curieux',
        'curieuse', 'dynamique', 'motive', 'motivee', 'passionne', 'passionnee', 'capacite', 'aptitude', 'aptitudes',
        'esprit', 'sens', 'maitrise', 'connaissance', 'connaissances', 'experience', 'experiences', 'expertise',
        'developpeur', 'developpeuse', 'developpeurs', 'ingenieur', 'ingenieure', 'ingenieurs', 'consultant',
        'consultante', 'analyste', 'architecte', 'poste', 'emploi', 'offre', 'candidat', 'candidate', 'candidats',
        'entreprise', 'societe', 'equipe', 'equipes', 'client', 'clients', 'utilisateurs', 'environnement',
        'culture', 'valeurs', 'avantages', 'salaire', 'remuneration', 'teletravail', 'hybride', 'lieu', 'annee',
        'annees', 'ans', 'mois', 'temps', 'plein', 'partiel', 'cdi', 'cdd', 'missions', 'mission', 'taches',
        'responsabilites', 'solutions', 'solution', 'produits', 'produit', 'fonctionnalites', 'systemes', 'services',
        'applications', 'application', 'logiciel', 'logiciels', 'outils', 'outil', 'technologies', 'technologie',
        'technique', 'techniques', 'plateforme', 'projets', 'projet', 'domaine', 'secteur', 'niveau', 'diplome',
        'formation', 'communication', 'relationnel', 'qualites', 'qualite', 'savoir', 'etre', 'nouvelles', 'nouveaux',
        'nouveau', 'nouvelle', 'differents', 'differentes', 'divers', 'diverses', 'multiples', 'cadre', 'sein',
        'croissance', 'enjeux', 'besoins', 'objectifs', 'developpement', 'conception', 'place', 'aide', 'rigueur',
        'pedagogie', 'ecole', 'etudes', 'etude', 'donnees', 'analyse', 'h/f', 'f/h', 'fier', 'fiere', 'fiers',
    ],
};

/** Section headings, used to weight where a keyword appears in the posting. */
export const SECTION_HEADINGS: { weight: number; patterns: string[] }[] = [
    {
        // requirements: where hard skills live
        weight: 1.3,
        patterns: [
            'requirements?', 'qualifications?', '(?:required|preferred|technical|key|core) skills?', 'skills?',
            'must[- ]haves?', '(?:tech|technology|technical) stack', 'stack', 'technologies', 'tech',
            'what (?:you(?:\'ll)?|we) (?:bring|need|have|are looking for|look for)', 'who you are', '(?:your|the) profile',
            'profile', 'about you', 'you have', 'you are', 'experience', 'exigences', 'competences(?: requises| techniques)?',
            'profil(?: recherche| du candidat| souhaite)?', 'ce que (?:tu|vous) apporte[sz]?', 'savoir[- ]faire',
            '(?:stack|environnement) techniques?', 'votre profil', 'ton profil', 'qualifications requises',
        ],
    },
    {
        weight: 1.15,
        patterns: ['nice[- ]to[- ]haves?', 'bonus(?: points)?', 'preferred qualifications', 'atouts?', 'un plus'],
    },
    {
        weight: 1,
        patterns: [
            'responsibilities', 'what you(?:\'ll| will) do', 'the role', 'your role', 'role', 'duties', 'missions?',
            'vos missions', 'tes missions', 'description(?: du poste)?', 'taches', 'responsabilites', 'le poste',
        ],
    },
    {
        // company pitch, benefits, legal: rarely skills
        weight: 0.4,
        patterns: [
            'about (?:us|the company|the team)', 'who we are', 'benefits', 'perks', 'what we offer', 'why join(?: us)?',
            'compensation', 'salary', 'equal (?:opportunity|employment).*', 'eeo', 'diversity.*', 'avantages',
            'a propos(?: de nous)?', 'qui sommes[- ]nous', 'pourquoi nous rejoindre', 'ce que nous (?:offrons|proposons)',
            'remuneration', 'entreprise', 'nous offrons',
        ],
    },
];

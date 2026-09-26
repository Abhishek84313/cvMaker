import { Language } from '../../../../shared/profile.interface';

export interface LabelledJobDescription {
    name: string;
    language: Language;
    text: string;
    /** Keywords a recruiter / ATS would expect to be extracted. Matching is case and accent insensitive. */
    expected: string[];
}

export const JOB_DESCRIPTIONS: LabelledJobDescription[] = [
    {
        name: 'Senior Full-Stack Engineer (EN)',
        language: Language.ENGLISH,
        text: `About Us
We're a fast-growing fintech company on a mission to make payments simple for everyone. Our culture values ownership, curiosity and great teamwork.

What you'll do
- Develop and maintain scalable web applications using React and TypeScript on the front-end and Node.js on the back-end.
- Design RESTful APIs and GraphQL endpoints consumed by our mobile apps.
- Build CI/CD pipelines with GitHub Actions and deploy services to AWS (ECS, Lambda, S3).
- Collaborate closely with product managers and designers to deliver high-quality features.
- Write unit tests and integration tests; participate in code reviews.

Requirements
- 5+ years of experience in full-stack development.
- Strong proficiency in JavaScript, TypeScript and React.
- Solid experience with Node.js, Express and PostgreSQL.
- Experience with Docker and Kubernetes.
- Familiarity with event-driven architecture and Kafka is a plus.
- Excellent communication skills.

Benefits
Competitive salary, remote-friendly office, health insurance and a yearly learning budget.`,
        expected: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'GraphQL', 'REST', 'CI/CD', 'GitHub Actions', 'AWS',
            'ECS', 'AWS Lambda', 'S3', 'Unit testing', 'Integration testing', 'Code review', 'Express', 'PostgreSQL',
            'Docker', 'Kubernetes', 'Event-driven architecture', 'Kafka', 'Full-stack', 'Payments', 'Fintech'],
    },
    {
        name: 'Data Scientist (EN)',
        language: Language.ENGLISH,
        text: `Data Scientist - Customer Analytics

The role
You will join our analytics team to build machine learning models that predict customer churn and lifetime value. You will work with large datasets in Snowflake and Databricks, and present insights to stakeholders.

Responsibilities
- Develop, validate and deploy predictive models (classification, regression, time series forecasting).
- Build data pipelines with Airflow and dbt.
- Run A/B testing and causal inference analyses to measure the impact of marketing campaigns.
- Create dashboards in Tableau or Power BI.

Qualifications
- MSc or PhD in Statistics, Computer Science or a related field.
- 3+ years of hands-on experience with Python (pandas, NumPy, scikit-learn) and SQL.
- Experience with deep learning frameworks such as PyTorch or TensorFlow.
- Knowledge of MLOps practices (model monitoring, feature stores) is a plus.
- Experience with Spark is desirable.`,
        expected: ['Machine Learning', 'Snowflake', 'Databricks', 'Python', 'Pandas', 'NumPy', 'scikit-learn', 'SQL',
            'Deep Learning', 'PyTorch', 'TensorFlow', 'MLOps', 'Spark', 'Airflow', 'dbt', 'A/B testing', 'Tableau',
            'Power BI', 'Statistics', 'Computer Science', 'PhD', 'causal inference', 'time series forecasting',
            'predictive models', 'churn', 'regression', 'classification', 'feature stores', 'Forecasting'],
    },
    {
        name: 'DevOps / SRE Engineer (EN)',
        language: Language.ENGLISH,
        text: `We are looking for a DevOps Engineer to help us scale our cloud infrastructure.

Your responsibilities:
Maintain and improve our infrastructure on Microsoft Azure and Google Cloud.
Automate provisioning with Terraform and Ansible (Infrastructure as Code).
Operate Kubernetes clusters (AKS, GKE) and Helm charts.
Own observability: Prometheus, Grafana, OpenTelemetry and on-call incident response.
Improve CI/CD using Jenkins and Argo CD.
Harden systems following CIS benchmarks and ISO 27001 requirements.

What we need from you:
3+ years as an SRE or DevOps engineer.
Strong Linux administration and Bash or Python scripting skills.
Deep understanding of networking (TCP/IP, DNS, load balancing).
Experience with Go is a strong plus.
Nice to have: CKA certification.`,
        expected: ['Azure', 'GCP', 'Terraform', 'Ansible', 'Infrastructure as Code', 'Kubernetes', 'AKS', 'GKE', 'Helm',
            'Observability', 'Prometheus', 'Grafana', 'OpenTelemetry', 'incident response', 'CI/CD', 'Jenkins',
            'Argo CD', 'CIS benchmarks', 'ISO 27001', 'SRE', 'DevOps', 'Linux', 'Bash', 'Python', 'Networking',
            'TCP/IP', 'DNS', 'Load balancing', 'Go', 'CKA', 'Helm charts', 'on-call'],
    },
    {
        name: 'Product Manager (EN)',
        language: Language.ENGLISH,
        text: `Product Manager, Payments Platform

Who we are
We build the checkout experience used by 20,000 merchants worldwide. We move fast and care deeply about our users.

What you will do
Own the product roadmap for our payments platform and define OKRs with engineering leadership.
Conduct user research and customer interviews, translate insights into clear product requirements.
Prioritize the backlog in Jira and run Agile ceremonies with a Scrum team.
Partner with Compliance on PCI DSS, KYC and AML topics.
Analyze funnel metrics with SQL and Looker to drive conversion.

About you
4+ years of product management experience in fintech or e-commerce.
Great stakeholder management and written communication.
Understanding of APIs and payment rails (card networks, SEPA, ACH).
Bonus: experience with A/B testing and pricing strategy.`,
        expected: ['Product management', 'Roadmap', 'OKR', 'User research', 'customer interviews', 'product requirements',
            'Jira', 'Agile', 'Scrum', 'backlog', 'Compliance', 'PCI DSS', 'KYC', 'AML', 'SQL', 'Looker', 'funnel metrics',
            'conversion', 'Fintech', 'E-commerce', 'Stakeholder management', 'APIs', 'payment rails', 'SEPA', 'ACH',
            'card networks', 'A/B testing', 'pricing strategy', 'Payments', 'checkout'],
    },
    {
        name: 'Accountant (EN, non-tech)',
        language: Language.ENGLISH,
        text: `Senior Accountant

Responsibilities
- Prepare monthly, quarterly and annual financial statements under IFRS.
- Perform account reconciliations, accruals and month-end close.
- Support the external audit and tax filings (VAT, corporate income tax).
- Maintain the general ledger in SAP and improve internal controls (SOX).
- Build financial models and variance analysis in Excel for budgeting and forecasting.

Requirements
- CPA or ACCA designation.
- 5 years of experience in accounting, ideally in a Big Four firm.
- Advanced Excel (pivot tables, VLOOKUP) and experience with Power BI.
- Fluent English; French is a plus.`,
        expected: ['IFRS', 'financial statements', 'account reconciliations', 'accruals', 'month-end close', 'Auditing',
            'tax filings', 'VAT', 'corporate income tax', 'general ledger', 'SAP', 'internal controls', 'SOX',
            'Financial modeling', 'variance analysis', 'Excel', 'Budgeting', 'Forecasting', 'CPA', 'ACCA',
            'Accounting', 'Big Four', 'pivot tables', 'VLOOKUP', 'Power BI', 'English', 'French'],
    },
    {
        name: 'Développeur Java (FR)',
        language: Language.FRENCH,
        text: `Développeur Java Spring Boot - H/F

À propos de nous
Nous sommes une entreprise dynamique du secteur bancaire, fière de nos valeurs et de notre culture d'innovation.

Vos missions
Vous participerez à la conception et au développement de microservices en Java 17 et Spring Boot.
Vous développerez des API REST et assurerez leur documentation avec OpenAPI.
Vous mettrez en place des pipelines CI/CD avec GitLab CI et déploierez sur Kubernetes.
Vous rédigerez des tests unitaires avec JUnit et participerez aux revues de code.

Votre profil
Diplôme d'ingénieur ou Master en informatique.
Au moins 4 ans d'expérience en développement Java.
Maîtrise de Spring Boot, Hibernate et PostgreSQL.
Connaissance de Kafka et de Docker appréciée.
Pratique des méthodes agiles (Scrum).
Anglais technique.`,
        expected: ['Java', 'Spring Boot', 'Microservices', 'REST', 'OpenAPI', 'CI/CD', 'GitLab CI', 'Kubernetes',
            'tests unitaires', 'JUnit', 'revues de code', 'Master', 'informatique', 'Hibernate', 'PostgreSQL',
            'Kafka', 'Docker', 'méthodes agiles', 'Scrum', 'Anglais', 'secteur bancaire'],
    },
    {
        name: 'Analyste de données (FR)',
        language: Language.FRENCH,
        text: `Analyste de données confirmé(e)

L'entreprise
Leader de la grande distribution, nous accompagnons des millions de clients chaque jour.

Tes missions
Tu analyseras les ventes et le comportement d'achat des clients à l'aide de SQL et Python.
Tu construiras des tableaux de bord sous Power BI pour les équipes marketing et supply chain.
Tu modéliseras les données dans BigQuery et automatiseras les flux ETL avec Airflow.
Tu réaliseras des études de segmentation client et des prévisions de ventes.

Ton profil
Bac+5 en statistiques, économétrie ou école d'ingénieur.
2 à 3 ans d'expérience en analyse de données.
Excellente maîtrise d'Excel et de SQL ; la connaissance de Looker est un atout.
Esprit d'analyse, rigueur et sens de la pédagogie.
Conformité RGPD.`,
        expected: ['SQL', 'Python', 'Power BI', 'BigQuery', 'ETL', 'Airflow', 'segmentation client', 'prévisions de ventes',
            'statistiques', 'économétrie', 'analyse de données', 'Excel', 'Looker', 'RGPD', 'tableaux de bord', 'Supply chain',
            'grande distribution', 'comportement d\'achat', 'Bac+5', 'Data Modeling'],
    },
];

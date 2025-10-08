import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count')) || 3;

    // Sample test ideas
    const testIdeas = [
        {
            id: '1',
            title: 'AI-Powered Personal Finance Advisor',
            description: 'An intelligent financial planning tool that uses machine learning to provide personalized investment advice and budgeting strategies.',
            category: 'Tech',
            date: new Date().toISOString(),
            marketOpportunity: 'The global robo-advisor market is projected to reach $1.2 trillion by 2027, with increasing demand for personalized financial guidance.',
            targetAudience: 'Millennials and Gen Z consumers seeking affordable, tech-savvy financial planning solutions with minimal human interaction.',
            revenueModel: 'Subscription-based model with tiered pricing ($9.99-$29.99/month), premium features, and partnerships with financial institutions.',
            keyChallenges: 'Regulatory compliance across different jurisdictions, building trust with users for financial decisions, and competition from established banks.'
        },
        {
            id: '2',
            title: 'Sustainable Packaging Marketplace',
            description: 'An online platform connecting eco-conscious businesses with suppliers of sustainable packaging materials and solutions.',
            category: 'E-commerce',
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            marketOpportunity: 'The sustainable packaging market is growing at 7.4% CAGR and expected to reach $470 billion by 2027 as companies seek to reduce environmental impact.',
            targetAudience: 'Small to medium-sized businesses looking to adopt eco-friendly packaging solutions without extensive supply chain knowledge.',
            revenueModel: 'Commission-based transactions (5-10%), subscription fees for premium supplier listings, and consulting services for packaging optimization.',
            keyChallenges: 'Higher costs of sustainable materials, ensuring supplier authenticity, and educating businesses on benefits versus traditional packaging.'
        },
        {
            id: '3',
            title: 'Remote Team Culture Platform',
            description: 'A comprehensive solution for building and maintaining company culture in distributed teams through virtual events, recognition systems, and collaboration tools.',
            category: 'Remote Work',
            date: new Date(Date.now() - 172800000).toISOString(), // Two days ago
            marketOpportunity: 'With 16% of companies fully remote and 32% hybrid, the distributed workforce tools market is expanding rapidly with focus on employee engagement.',
            targetAudience: 'HR managers and team leaders in companies with remote or hybrid work policies seeking to improve employee satisfaction and retention.',
            revenueModel: 'Per-employee monthly subscription ($8-15/employee), enterprise plans with custom features, and integration partnerships with HRIS platforms.',
            keyChallenges: 'Creating genuine connections virtually, accommodating different time zones, and measuring cultural impact on business metrics.'
        },
        {
            id: '4',
            title: 'Personalized Nutrition Delivery Service',
            description: 'A meal kit service that uses DNA analysis and health tracking data to create customized nutrition plans and deliver perfectly portioned ingredients.',
            category: 'Health & Wellness',
            date: new Date(Date.now() - 259200000).toISOString(), // Three days ago
            marketOpportunity: 'The personalized nutrition market is experiencing rapid growth with a projected CAGR of 13.2% through 2028, driven by increased health awareness.',
            targetAudience: 'Health-conscious individuals seeking science-backed nutrition solutions, busy professionals wanting convenient healthy meals, and people with specific dietary needs.',
            revenueModel: 'Weekly subscription boxes ($12-18/meal), genetic testing kits ($99-149), premium consultation services, and corporate wellness partnerships.',
            keyChallenges: 'High logistics costs for perishable goods, obtaining regulatory approvals for health claims, and scaling personalization technology.'
        },
        {
            id: '5',
            title: 'EdTech Micro-Certification Platform',
            description: 'A blockchain-verified skill validation system offering bite-sized courses and certifications for in-demand professional skills with employer recognition.',
            category: 'Education',
            date: new Date(Date.now() - 345600000).toISOString(), // Four days ago
            marketOpportunity: 'Corporate learning market valued at $17.3 billion in 2022 with 85% of employees seeking skill development opportunities from employers.',
            targetAudience: 'Working professionals seeking career advancement, recent graduates entering competitive job markets, and employers investing in workforce development.',
            revenueModel: 'Course sales ($19-49 per certification), corporate licensing packages, premium verification services, and recruitment platform partnerships.',
            keyChallenges: 'Ensuring curriculum relevance with fast-changing industry demands, achieving widespread employer adoption, and maintaining assessment integrity.'
        }
    ];

    // Return requested number of ideas
    const ideas = testIdeas.slice(0, count);

    return NextResponse.json({
        success: true,
        ideas: ideas,
        count: ideas.length
    });
}
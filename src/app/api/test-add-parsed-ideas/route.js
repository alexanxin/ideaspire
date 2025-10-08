import { NextResponse } from 'next/server';
import { addParsedIdeasToDB } from '@/lib/addParsedIdeasToDB';

export async function GET(request) {
    // Check for authorization header to secure the endpoint
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN;

    if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        console.log('Testing adding parsed ideas to database...');

        // The parsed ideas from the response
        const parsedIdeas = [
            {
                "title": "CodeClarity AI",
                "description": "An AI-powered code analysis and enhancement tool that identifies security vulnerabilities, scalability issues, and areas for improvement in existing codebases, providing actionable suggestions for improvement.",
                "marketOpportunity": "Many Reddit posts highlighted the difficulty of achieving the 'last 10%' of software development – making it secure, scalable, and production-ready.  CodeClarity AI directly addresses this pain point by assisting developers in streamlining the often-complex and time-consuming final stages of development.",
                "targetAudience": "Software developers, startups, and small businesses developing their own software products.",
                "revenueModel": "Subscription-based model with tiered pricing based on features and usage.",
                "keyChallenges": "Accuracy of AI analysis, integration with various coding environments, competition from existing code analysis tools."
            },
            {
                "title": "SkillSpring",
                "description": "A platform connecting young entrepreneurs with mentors and resources to help them navigate the challenges of starting a business while managing debt and family expectations.  Provides curated learning paths, peer-to-peer support, and access to relevant financing options.",
                "marketOpportunity": "Multiple Reddit posts detailed the struggles of young entrepreneurs facing debt, family pressure, and a lack of direction. SkillSpring addresses this by providing a structured support system tailored to the unique needs of this demographic.",
                "targetAudience": "Young adults (18-25) with entrepreneurial aspirations and limited resources.",
                "revenueModel": "Subscription-based model with different tiers offering varying levels of access to resources and mentorship.",
                "keyChallenges": "Attracting mentors and securing partnerships with relevant resources, demonstrating value proposition to young entrepreneurs, managing a diverse community."
            },
            {
                "title": "LocalEats Marketplace",
                "description": "A platform for local restaurants to create professional online storefronts with customizable widgets for menus, ordering, loyalty programs, reservations, and more. Enforces minimum presentation standards to ensure a high-quality user experience.",
                "marketOpportunity": "Several Reddit posts expressed frustration with the outdated and inconsistent online presence of local restaurants. LocalEats Marketplace addresses this by providing a user-friendly platform that empowers local businesses to improve their online presence and customer experience.",
                "targetAudience": "Local restaurants and food businesses seeking to improve their online presence and customer engagement.",
                "revenueModel": "Subscription-based model with tiered pricing based on features and number of locations.",
                "keyChallenges": "Attracting restaurants to the platform, ensuring consistent platform maintenance and updates, competing with established online ordering and restaurant review platforms."
            },
            {
                "title": "BusinessFlow Solutions",
                "description": "A service providing customized business handbooks, magazines, and printable ebooks tailored to specific industries and company needs, improving internal communication, onboarding, and employee training.",
                "marketOpportunity": "One Reddit post explored creating customized business materials.  BusinessFlow Solutions directly addresses the need for professional, consistent, and branded internal communication resources for businesses of all sizes.",
                "targetAudience": "Small and medium-sized businesses, corporations looking for streamlined and high-quality internal communication materials.",
                "revenueModel": "Project-based fees or retainer agreements based on the scope of work and ongoing maintenance.",
                "keyChallenges": "Attracting clients, consistently delivering high-quality work, managing multiple projects simultaneously, keeping abreast of industry trends."
            },
            {
                "title": "VibeFlow",
                "description": "A no-code platform for creating interactive flowcharts and diagrams with animated connectors, easily exportable as GIFs or other formats for presentations and internal communication.",
                "marketOpportunity": "A Reddit post proposed a flowchart-to-GIF web app, citing a need for businesses to easily visualize business processes. VibeFlow addresses this by providing a user-friendly platform for creating visually appealing process diagrams.",
                "targetAudience": "Businesses and individuals seeking to improve the clarity and engagement of their business process presentations.",
                "revenueModel": "Subscription-based model with tiered pricing based on features and number of users.",
                "keyChallenges": "Competition from existing diagramming and presentation software, ensuring the platform is user-friendly and intuitive, providing enough features to stand out."
            },
            {
                "title": "TaskRabbit Pro",
                "description": "A platform connecting businesses with vetted freelancers for quick, short-term projects, offering a streamlined hiring process and quality control to reduce the time and effort spent finding reliable talent.",
                "marketOpportunity": "Multiple Reddit posts highlighted the frustrations of working with freelancers through platforms like Fiverr and Upwork. TaskRabbit Pro aims to improve this experience by focusing on quality control and efficient matching of businesses with skilled freelancers.",
                "targetAudience": "Small businesses and individuals needing to quickly find and hire freelancers for specific projects.",
                "revenueModel": "Commission-based model on successful project completions.",
                "keyChallenges": "Vetting and quality control of freelancers, managing disputes and payment processes, attracting both businesses and freelancers to the platform."
            },
            {
                "title": "GreenThumb Solutions",
                "description": "A consulting service that helps small businesses reduce their environmental impact through sustainable practices and technological solutions. Provides customized assessments, implementation support, and ongoing monitoring.",
                "marketOpportunity": "Reddit discussions indirectly highlighted the need for sustainability in business. GreenThumb Solutions offers businesses a pathway to incorporate sustainable practices, improving their brand image while reducing their environmental footprint.",
                "targetAudience": "Small businesses looking to adopt sustainable practices and demonstrate corporate social responsibility.",
                "revenueModel": "Consulting fees based on the complexity and scope of the project, potential recurring revenue for ongoing monitoring and support.",
                "keyChallenges": "Convincing businesses of the value proposition, acquiring skilled consultants, managing diverse projects and client needs."
            },
            {
                "title": "RemoteFlow",
                "description": "A platform offering tools and resources for managing remote teams, improving communication, collaboration, and project management. Includes features like integrated project management, communication tools, and performance tracking.",
                "marketOpportunity": "Reddit posts discussed the challenges of managing remote teams. RemoteFlow directly addresses these challenges by providing a comprehensive platform to facilitate efficient communication and collaboration within remote and distributed teams.",
                "targetAudience": "Remote teams, businesses with distributed workforces.",
                "revenueModel": "Subscription-based model with tiered pricing based on features and number of users.",
                "keyChallenges": "Competition from existing project management and communication platforms, ensuring platform security and data privacy, providing enough features to stand out."
            },
            {
                "title": "MindBodySync",
                "description": "An app providing personalized mindfulness and exercise programs tailored to individual needs and goals, including guided meditations, workout plans, and progress tracking. Incorporates gamification and community features to enhance motivation.",
                "marketOpportunity": "Though not directly mentioned, the general interest in self-improvement and well-being suggests a market for such tools. MindBodySync aims to address this by combining personalized wellness programs with engaging features designed to improve user adherence.",
                "targetAudience": "Individuals seeking to improve their mental and physical well-being through mindfulness and exercise.",
                "revenueModel": "Subscription-based model with tiered pricing based on features and level of personalization.",
                "keyChallenges": "Competition from existing fitness and mindfulness apps, ensuring program effectiveness and user engagement, adapting the platform to different user needs and preferences."
            },
            {
                "title": "Learnify AI",
                "description": "An AI-powered educational platform that adapts learning paths to individual student needs and learning styles. Provides personalized content, interactive exercises, and progress tracking to enhance learning outcomes.",
                "marketOpportunity": "Several Reddit threads indirectly highlighted the need for effective learning tools. Learnify AI leverages AI to personalize the learning experience, making education more engaging and effective for students of all ages and abilities.",
                "targetAudience": "Students, educators, and businesses seeking to improve learning outcomes through personalized educational experiences.",
                "revenueModel": "Subscription-based model for students and schools, potential revenue from customized educational solutions for businesses.",
                "keyChallenges": "Developing high-quality educational content, ensuring AI accuracy and fairness, integrating the platform with existing learning management systems."
            }
        ];

        // Add the ideas to the database
        const result = await addParsedIdeasToDB(parsedIdeas);

        if (!result.success) {
            console.error('Failed to add ideas to database:', result.error);
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to add ideas to database'
                },
                { status: 500 }
            );
        }

        console.log(`Successfully added ${result.count} ideas to database`);

        return NextResponse.json({
            success: true,
            message: result.message,
            ideas: result.ideas,
            count: result.count
        });

    } catch (error) {
        console.error('Error in test-add-parsed-ideas API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to add parsed ideas to database'
            },
            { status: 500 }
        );
    }
}
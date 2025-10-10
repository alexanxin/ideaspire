// This file should only be used on the server side.
// It contains imports for database connections and other Node.js specific modules.

'use server';

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils.js';
import { calculateIdeaSimilarity, findSimilarIdea } from '@/lib/similarityUtils.js';

// Parse the ideas from the response and add them to the database
export async function addParsedIdeasToDB(ideasArray, similarityThreshold = 0.7) {
    try {
        console.log(`Adding ${ideasArray.length} ideas to database...`);

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.warn('Supabase is not configured. Database functionality is disabled.');
            return {
                success: false,
                error: 'Supabase is not configured. Database functionality is disabled.'
            };
        }

        // Fetch existing ideas from the database to check for duplicates
        console.log('Fetching existing ideas from database for similarity check...');
        const { data: existingIdeas, error: fetchError } = await supabase
            .from('business_ideas')
            .select('id, title, description, category');

        if (fetchError) {
            console.error('Error fetching existing ideas for similarity check:', fetchError);
            return {
                success: false,
                error: fetchError.message
            };
        }

        console.log(`Fetched ${existingIdeas?.length || 0} existing ideas for similarity check`);

        // Process each idea and prepare for insertion
        const ideasToAdd = [];
        const duplicateIdeas = [];

        for (const [index, idea] of ideasArray.entries()) {
            // Create a temporary object with the correct field names for similarity check
            const ideaForComparison = {
                title: idea.title || `Idea ${index + 1}`,
                description: idea.description || 'No description provided',
                category: idea.category || 'Tech'
            };

            // Check for similarity with existing ideas
            const similarResult = findSimilarIdea(
                ideaForComparison,
                existingIdeas,
                similarityThreshold
            );

            if (similarResult.isSimilar) {
                console.log(`Duplicate idea found: "${idea.title}" is similar to existing idea "${similarResult.similarIdea.title}" (similarity: ${similarResult.similarity.toFixed(2)})`);
                duplicateIdeas.push({
                    original: idea,
                    similarTo: similarResult.similarIdea,
                    similarity: similarResult.similarity
                });
            }
            else {
                // Create a new object with the correct field names for the database
                const {
                    marketOpportunity,
                    targetAudience,
                    revenueModel,
                    keyChallenges,
                    sentiment,
                    emotion,
                    pain_score,
                    ...restOfIdea
                } = idea; // Destructure to separate camelCase fields from the rest

                // Add the transformed idea to the list for insertion
                ideasToAdd.push({
                    ...restOfIdea, // All other properties
                    // Ensure required fields have values
                    title: idea.title || `Idea ${index + 1}`,
                    description: idea.description || 'No description provided',
                    prompt: idea.prompt || idea.description || 'Generated idea', // Required field
                    date: formatDateForDatabase(getCurrentDate()),
                    category: idea.category || 'Tech', // Default category if not provided
                    created_at: new Date().toISOString(),
                    // Transform camelCase fields to snake_case to match DB schema
                    market_opportunity: marketOpportunity,
                    target_audience: targetAudience,
                    revenue_model: revenueModel,
                    key_challenges: keyChallenges,
                    // Add new sentiment fields
                    sentiment: sentiment,
                    emotion: emotion,
                    pain_score: pain_score,
                });
            }
        }

        console.log(`After similarity check: ${ideasToAdd.length} unique ideas to add, ${duplicateIdeas.length} duplicate ideas found`);

        // Insert only unique ideas into the database
        let result = {
            success: true,
            message: '',
            ideas: [],
            count: 0,
            duplicates: duplicateIdeas
        };

        if (ideasToAdd.length > 0) {
            // Validate the ideas to be added before insertion
            const validIdeasToAdd = ideasToAdd.filter(idea => {
                if (!idea || typeof idea !== 'object') {
                    console.error('Invalid idea object found:', idea);
                    return false;
                }
                return true;
            });

            if (validIdeasToAdd.length !== ideasToAdd.length) {
                console.warn(`Filtered out ${ideasToAdd.length - validIdeasToAdd.length} invalid ideas`);
            }

            const { data, error } = await supabase
                .from('business_ideas')
                .insert(validIdeasToAdd)
                .select();

            if (error) {
                console.error('Error inserting ideas into database:', error);
                return {
                    success: false,
                    error: error.message,
                    duplicates: duplicateIdeas
                };
            }

            console.log(`Successfully added ${data.length} ideas to database`);

            result.message = `Successfully added ${data.length} unique ideas to database`;
            result.ideas = data;
            result.count = data.length;
        } else {
            result.message = 'No new unique ideas to add to database';
            console.log('No new unique ideas to add to database');
        }

        if (duplicateIdeas.length > 0) {
            result.message += `, ${duplicateIdeas.length} duplicate ideas skipped`;
        }

        return result;
    } catch (error) {
        console.error('Error in addParsedIdeasToDB:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Example usage function
export async function addSampleIdeas(similarityThreshold = 0.7) {
    const sampleIdeas = [
        {
            "title": "CodeClarity AI",
            "description": "An AI-powered code analysis and enhancement tool that identifies security vulnerabilities, scalability issues, and areas for improvement in existing codebases, providing actionable suggestions for improvement.",
            "marketOpportunity": "Many Reddit posts highlighted the difficulty of achieving the 'last 10%' of software development – making it secure, scalable, and production-ready.  CodeClarity AI directly addresses this pain point by assisting developers in streamlining the often-complex and time-consuming final stages of development.",
            "targetAudience": "Software developers, startups, and small businesses developing their own software products.",
            "revenueModel": "Subscription-based model with tiered pricing based on features and usage.",
            "keyChallenges": "Accuracy of AI analysis, integration with various coding environments, competition from existing code analysis tools.",
            "category": "Tech"
        },
        {
            "title": "SkillSpring",
            "description": "A platform connecting young entrepreneurs with mentors and resources to help them navigate the challenges of starting a business while managing debt and family expectations.  Provides curated learning paths, peer-to-peer support, and access to relevant financing options.",
            "marketOpportunity": "Multiple Reddit posts detailed the struggles of young entrepreneurs facing debt, family pressure, and a lack of direction. SkillSpring addresses this by providing a structured support system tailored to the unique needs of this demographic.",
            "targetAudience": "Young adults (18-25) with entrepreneurial aspirations and limited resources.",
            "revenueModel": "Subscription-based model with different tiers offering varying levels of access to resources and mentorship.",
            "keyChallenges": "Attracting mentors and securing partnerships with relevant resources, demonstrating value proposition to young entrepreneurs, managing a diverse community.",
            "category": "Startup"
        },
        {
            "title": "LocalEats Marketplace",
            "description": "A platform for local restaurants to create professional online storefronts with customizable widgets for menus, ordering, loyalty programs, reservations, and more. Enforces minimum presentation standards to ensure a high-quality user experience.",
            "marketOpportunity": "Several Reddit posts expressed frustration with the outdated and inconsistent online presence of local restaurants. LocalEats Marketplace addresses this by providing a user-friendly platform that empowers local businesses to improve their online presence and customer experience.",
            "targetAudience": "Local restaurants and food businesses seeking to improve their online presence and customer engagement.",
            "revenueModel": "Subscription-based model with tiered pricing based on features and number of locations.",
            "keyChallenges": "Attracting restaurants to the platform, ensuring consistent platform maintenance and updates, competing with established online ordering and restaurant review platforms.",
            "category": "E-commerce"
        },
        {
            "title": "BusinessFlow Solutions",
            "description": "A service providing customized business handbooks, magazines, and printable ebooks tailored to specific industries and company needs, improving internal communication, onboarding, and employee training.",
            "marketOpportunity": "One Reddit post explored creating customized business materials.  BusinessFlow Solutions directly addresses the need for professional, consistent, and branded internal communication resources for businesses of all sizes.",
            "targetAudience": "Small and medium-sized businesses, corporations looking for streamlined and high-quality internal communication materials.",
            "revenueModel": "Project-based fees or retainer agreements based on the scope of work and ongoing maintenance.",
            "keyChallenges": "Attracting clients, consistently delivering high-quality work, managing multiple projects simultaneously, keeping abreast of industry trends.",
            "category": "Service"
        },
        {
            "title": "VibeFlow",
            "description": "A no-code platform for creating interactive flowcharts and diagrams with animated connectors, easily exportable as GIFs or other formats for presentations and internal communication.",
            "marketOpportunity": "A Reddit post proposed a flowchart-to-GIF web app, citing a need for businesses to easily visualize business processes. VibeFlow addresses this by providing a user-friendly platform for creating visually appealing process diagrams.",
            "targetAudience": "Businesses and individuals seeking to improve the clarity and engagement of their business process presentations.",
            "revenueModel": "Subscription-based model with tiered pricing based on features and number of users.",
            "keyChallenges": "Competition from existing diagramming and presentation software, ensuring the platform is user-friendly and intuitive, providing enough features to stand out.",
            "category": "Vibe Coding"
        },
        {
            "title": "TaskRabbit Pro",
            "description": "A platform connecting businesses with vetted freelancers for quick, short-term projects, offering a streamlined hiring process and quality control to reduce the time and effort spent finding reliable talent.",
            "marketOpportunity": "Multiple Reddit posts highlighted the frustrations of working with freelancers through platforms like Fiverr and Upwork. TaskRabbit Pro aims to improve this experience by focusing on quality control and efficient matching of businesses with skilled freelancers.",
            "targetAudience": "Small businesses and individuals needing to quickly find and hire freelancers for specific projects.",
            "revenueModel": "Commission-based model on successful project completions.",
            "keyChallenges": "Vetting and quality control of freelancers, managing disputes and payment processes, attracting both businesses and freelancers to the platform.",
            "category": "Quick Money"
        },
        {
            "title": "GreenThumb Solutions",
            "description": "A consulting service that helps small businesses reduce their environmental impact through sustainable practices and technological solutions. Provides customized assessments, implementation support, and ongoing monitoring.",
            "marketOpportunity": "Reddit discussions indirectly highlighted the need for sustainability in business. GreenThumb Solutions offers businesses a pathway to incorporate sustainable practices, improving their brand image while reducing their environmental footprint.",
            "targetAudience": "Small businesses looking to adopt sustainable practices and demonstrate corporate social responsibility.",
            "revenueModel": "Consulting fees based on the complexity and scope of the project, potential recurring revenue for ongoing monitoring and support.",
            "keyChallenges": "Convincing businesses of the value proposition, acquiring skilled consultants, managing diverse projects and client needs.",
            "category": "Social Impact"
        },
        {
            "title": "RemoteFlow",
            "description": "A platform offering tools and resources for managing remote teams, improving communication, collaboration, and project management. Includes features like integrated project management, communication tools, and performance tracking.",
            "marketOpportunity": "Reddit posts discussed the challenges of managing remote teams. RemoteFlow directly addresses these challenges by providing a comprehensive platform to facilitate efficient communication and collaboration within remote and distributed teams.",
            "targetAudience": "Remote teams, businesses with distributed workforces.",
            "revenueModel": "Subscription-based model with tiered pricing based on features and number of users.",
            "keyChallenges": "Competition from existing project management and communication platforms, ensuring platform security and data privacy, providing enough features to stand out.",
            "category": "Remote Work"
        },
        {
            "title": "MindBodySync",
            "description": "An app providing personalized mindfulness and exercise programs tailored to individual needs and goals, including guided meditations, workout plans, and progress tracking. Incorporates gamification and community features to enhance motivation.",
            "marketOpportunity": "Though not directly mentioned, the general interest in self-improvement and well-being suggests a market for such tools. MindBodySync aims to address this by combining personalized wellness programs with engaging features designed to improve user adherence.",
            "targetAudience": "Individuals seeking to improve their mental and physical well-being through mindfulness and exercise.",
            "revenueModel": "Subscription-based model with tiered pricing based on features and level of personalization.",
            "keyChallenges": "Competition from existing fitness and mindfulness apps, ensuring program effectiveness and user engagement, adapting the platform to different user needs and preferences.",
            "category": "Health & Wellness"
        },
        {
            "title": "Learnify AI",
            "description": "An AI-powered educational platform that adapts learning paths to individual student needs and learning styles. Provides personalized content, interactive exercises, and progress tracking to enhance learning outcomes.",
            "marketOpportunity": "Several Reddit threads indirectly highlighted the need for effective learning tools. Learnify AI leverages AI to personalize the learning experience, making education more engaging and effective for students of all ages and abilities.",
            "targetAudience": "Students, educators, and businesses seeking to improve learning outcomes through personalized educational experiences.",
            "revenueModel": "Subscription-based model for students and schools, potential revenue from customized educational solutions for businesses.",
            "keyChallenges": "Developing high-quality educational content, ensuring AI accuracy and fairness, integrating the platform with existing learning management systems.",
            "category": "Education"
        }
    ];

    return await addParsedIdeasToDB(sampleIdeas, similarityThreshold);
}

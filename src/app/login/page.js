"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import DemoSlotMachine from '@/components/DemoSlotMachine';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Floating idea card with drag functionality
const FloatingIdeaCard = ({ idea, position, fading }) => {
    const categoryClasses = getCategoryClasses(idea?.category);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [currentPosition, setCurrentPosition] = useState(position);
    const cardRef = useRef(null);

    // Update position when props change
    useEffect(() => {
        setCurrentPosition(position);
    }, [position]);

    const handleMouseDown = (e) => {
        // Only allow dragging with left mouse button
        if (e.button !== 0) return;

        setIsDragging(true);
        const rect = cardRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        e.preventDefault(); // Prevent text selection
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        setCurrentPosition({
            left: newX,
            top: newY
        });
    }, [isDragging, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Handle case where idea is null or undefined
    if (!idea) return null;

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: fading ? 0 : 1 }}

            className={`absolute ${categoryClasses.bg} backdrop-blur-sm rounded-lg p-4 w-[250px] border border-gray-700/50 shadow-lg z-10 cursor-grab active:cursor-grabbing select-none hover:scale-105 transition-transform duration-200`}
            style={{
                left: `${currentPosition.left}px`,
                top: `${currentPosition.top}px`,
                zIndex: isDragging ? 1000 : 10
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center mb-2">
                <span className={`inline-block px-2 py-1 ${categoryClasses.tagBg} rounded text-xs text-white font-medium`}>
                    {idea.category}
                </span>
            </div>

            <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                {idea.title}
            </h4>

            <p className="text-gray-300 text-xs leading-relaxed">
                {idea.description}
            </p>
        </motion.div>
    );
};

const getCategoryClasses = (category) => {
    const categoryStyles = {
        'Tech': { border: 'border-indigo-600/40', bg: 'bg-indigo-900/15', tagBg: 'bg-indigo-600/40' },
        'Startup': { border: 'border-purple-60/40', bg: 'bg-purple-900/15', tagBg: 'bg-purple-600/40' },
        'E-commerce': { border: 'border-green-600/40', bg: 'bg-green-900/15', tagBg: 'bg-green-600/40' },
        'Service': { border: 'border-yellow-600/40', bg: 'bg-yellow-900/15', tagBg: 'bg-yellow-600/40' },
        'Quick Money': { border: 'border-red-600/40', bg: 'bg-red-900/15', tagBg: 'bg-red-60/40' },
        'Social Impact': { border: 'border-teal-600/40', bg: 'bg-teal-900/15', tagBg: 'bg-teal-600/40' },
        'Remote Work': { border: 'border-cyan-600/40', bg: 'bg-cyan-900/15', tagBg: 'bg-cyan-600/40' },
        'Health & Wellness': { border: 'border-pink-600/40', bg: 'bg-pink-900/15', tagBg: 'bg-pink-600/40' },
        'Education': { border: 'border-orange-600/40', bg: 'bg-orange-900/15', tagBg: 'bg-orange-600/40' },
        'default': { border: 'border-gray-600/40', bg: 'bg-gray-900/15', tagBg: 'bg-gray-600/40' }
    };
    return categoryStyles[category] || categoryStyles.default;
};

const generateRandomPosition = (existingPositions, slotMachineRect, containerRect) => {
    const cardWidth = 250; // w-[250px]
    const cardHeight = 180; // Approximate height
    const allowedOverlap = 0.05; // 5%
    const padding = 20; // Increased padding to keep cards from the edges

    // Define areas around the slot machine where cards can appear
    const topArea = {
        left: padding,
        right: containerRect.width - padding,
        top: padding,
        bottom: Math.max(padding, slotMachineRect.top - containerRect.top)
    };
    const bottomArea = {
        left: padding,
        right: containerRect.width - padding,
        top: Math.min(containerRect.height - padding, slotMachineRect.bottom - containerRect.top),
        bottom: containerRect.height - padding
    };
    const leftArea = {
        left: padding,
        right: Math.max(padding, slotMachineRect.left - containerRect.left),
        top: padding,
        bottom: containerRect.height - padding
    };
    const rightArea = {
        left: Math.min(containerRect.width - padding, slotMachineRect.right - containerRect.left),
        right: containerRect.width - padding,
        top: padding,
        bottom: containerRect.height - padding
    };

    const validAreas = [topArea, bottomArea, leftArea, rightArea].filter(
        area => area.right > area.left && area.bottom > area.top
    );

    if (validAreas.length === 0) {
        // Fallback if no valid areas are available
        return { left: padding, top: padding };
    }

    // Try multiple attempts to find a position
    for (let attempt = 0; attempt < 100; attempt++) {
        const area = validAreas[Math.floor(Math.random() * validAreas.length)];
        const left = Math.random() * (area.right - area.left - cardWidth) + area.left;
        const top = Math.random() * (area.bottom - area.top - cardHeight) + area.top;

        // AABB collision detection with allowed overlap
        const doesOverlap = existingPositions.some(existingPos => {
            const newCard = { left: left, top: top, right: left + cardWidth, bottom: top + cardHeight };
            const existingCard = { left: existingPos.left, top: existingPos.top, right: existingPos.left + cardWidth, bottom: existingPos.top + cardHeight };

            // Check for non-collision
            if (newCard.right - (cardWidth * allowedOverlap) < existingCard.left ||
                newCard.left + (cardWidth * allowedOverlap) > existingCard.right ||
                newCard.bottom - (cardHeight * allowedOverlap) < existingCard.top ||
                newCard.top + (cardHeight * allowedOverlap) > existingCard.bottom) {
                return false; // No collision
            }
            return true; // Collision
        });

        if (!doesOverlap) {
            return { left, top };
        }
    }

    // Fallback if no non-overlapping position is found
    const randomArea = validAreas[Math.floor(Math.random() * validAreas.length)];
    const left = Math.random() * (randomArea.right - randomArea.left - cardWidth) + randomArea.left;
    const top = Math.random() * (randomArea.bottom - randomArea.top - cardHeight) + randomArea.top;

    return { left, top };
};

export default function LoginPage() {
    const { supabase, user } = useSupabase();
    const router = useRouter();
    const [redirectUrl, setRedirectUrl] = useState('/');
    const [openIdeas, setOpenIdeas] = useState([]);
    const [isFading, setIsFading] = useState(false);
    const fadeTimeoutRef = useRef(null);
    const slotMachineRef = useRef(null);
    const leftColumnRef = useRef(null);

    const addIdea = (idea) => {
        if (isFading) return;

        if (!slotMachineRef.current || !leftColumnRef.current) {
            console.warn("Refs not available for positioning.");
            return;
        }

        const slotMachineRect = slotMachineRef.current.getBoundingClientRect();
        const containerRect = leftColumnRef.current.getBoundingClientRect();
        const position = generateRandomPosition(openIdeas.map(item => item.position), slotMachineRect, containerRect);

        const newIdea = {
            id: Date.now() + Math.random(),
            idea,
            position,
            fading: false
        };

        setOpenIdeas(prev => [...prev, newIdea]);
    };

    useEffect(() => {
        // Set redirect URL on client side to avoid SSR issues
        if (typeof window !== 'undefined') {
            // For development, force localhost redirect
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setRedirectUrl('http://localhost:3000/');
            } else {
                setRedirectUrl(`${window.location.origin}/`);
            }
        }

        const handleResize = () => {
            if (leftColumnRef.current) {
                // Force a re-render to update the containerRect
                setOpenIdeas(prev => [...prev]);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            // Clean up any pending fade timeout
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
                fadeTimeoutRef.current = null;
            }
        };
    }, []);

    // Effect to handle timeout when 10 floating ideas are displayed
    useEffect(() => {
        // If we have 10 or more ideas and no timeout is currently set, set the timeout
        if (openIdeas.length >= 10 && !isFading && !fadeTimeoutRef.current) {
            fadeTimeoutRef.current = setTimeout(() => {
                setIsFading(true);
                setOpenIdeas(prev => prev.map(item => ({ ...item, fading: true })));
                setTimeout(() => {
                    setOpenIdeas([]);
                    setIsFading(false);
                    fadeTimeoutRef.current = null; // Reset the ref
                    // Reset global idea tracking when floating ideas are cleared
                    if (slotMachineRef.current?.resetGlobalIdeaTracking) {
                        slotMachineRef.current.resetGlobalIdeaTracking();
                    }
                }, 500); // Fade duration
            }, 10000); // 10 second delay before starting fade
        }
    }, [openIdeas, isFading]);

    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        if (user && selectedRole) {
            // Store role in localStorage
            localStorage.setItem('userRole', selectedRole);

            // Update user role in the database
            updateUserRole(selectedRole);

            router.push('/');
        }
        // Auto-save role when user logs in
        else if (user) {
            // Default role is backer
            const role = selectedRole || 'backer';

            // Store role in localStorage
            localStorage.setItem('userRole', role);

            // Update user role in the database
            updateUserRole(role);

            router.push('/');
        }
    }, [user, selectedRole, router]);

    // Check if user is already logged in and has a role set
    useEffect(() => {
        if (user) {
            const existingRole = localStorage.getItem('userRole');
            if (existingRole) {
                // If user already has a role, redirect them to the home page
                router.push('/');
            }
        }
    }, [user, router]);

    // Function to update user role in the database
    const updateUserRole = async (role) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    role: role,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) {
                console.error('Error updating user role:', error);
            } else {
                console.log('User role updated successfully');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    if (user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center max-w-md">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="mb-6">Welcome! Please select your role:</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setSelectedRole('founder')}
                            className="px-6 py-3 bg-indigo-60 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            I'm a Founder
                        </button>
                        <button
                            onClick={() => setSelectedRole('backer')}
                            className="px-6 py-3 bg-teal-60 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                        >
                            I'm a Backer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="min-h-screen mx-auto h-full flex items-center justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-center h-full min-h-screen">
                    {/* Left Column - Demo Slot Machine */}
                    <div className="flex justify-center bg-black h-full items-center relative" ref={leftColumnRef}>
                        <DemoSlotMachine onIdeaRevealed={addIdea} paused={isFading || openIdeas.length >= 10} ref={slotMachineRef} />

                        {/* Floating Idea Cards */}
                        {openIdeas.map((item) => (
                            <FloatingIdeaCard
                                key={item.id}
                                idea={item.idea}
                                position={item.position}
                                fading={item.fading}
                            />
                        ))}
                    </div>

                    {/* Right Column - Login Form */}
                    <div className="flex justify-center">
                        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8">
                            <div className="text-center mb-8">
                                <Image src="/logo.png" alt="Ideaspire Logo" width={60} height={60} className="mx-auto mb-4" />
                                <h1 className="text-3xl font-bold text-white mb-2">Welcome to <span className="text-gradient">IDEASPIRE</span></h1>
                                <p className="text-gray-400">Get 5 free spins and a daily business idea. Sign in to start.</p>
                            </div>

                            {/* Role Selection Switch */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <span className={`mr-4 px-3 py-1 rounded-l-lg font-medium transition-colors ${selectedRole === 'backer' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        Backer
                                    </span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setSelectedRole(selectedRole === 'backer' ? 'founder' : 'backer')}
                                            className="w-14 h-7 flex items-center bg-gray-600 rounded-full p-1 transition-colors duration-300 ease-in-out"
                                            style={{
                                                backgroundColor: selectedRole ? (selectedRole === 'founder' ? '#4f46e5' : '#0d9488') : '#6b7280'
                                            }}
                                        >
                                            <div
                                                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${selectedRole === 'founder' ? 'translate-x-7' : 'translate-x-0'}`}
                                            ></div>
                                        </button>
                                    </div>
                                    <span className={`ml-4 px-3 py-1 rounded-r-lg font-medium transition-colors ${selectedRole === 'founder' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        Founder
                                    </span>
                                </div>
                                <p className="text-center text-sm text-gray-400">
                                    {selectedRole === 'founder'
                                        ? 'As a Founder, you can create and manage business ideas'
                                        : 'As a Backer, you can discover and support business ideas'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <Auth
                                    supabaseClient={supabase}
                                    appearance={{
                                        theme: ThemeSupa,
                                        variables: {
                                            default: {
                                                colors: {
                                                    brand: '#6366f1',
                                                    brandAccent: '#4f46e5',
                                                    brandButtonText: 'white',
                                                    defaultButtonBackground: '#374151',
                                                    defaultButtonBackgroundHover: '#4b5563',
                                                    inputBackground: '#151b24',
                                                    inputBorder: '#14495a',
                                                    inputBorderHover: '#4b5563',
                                                    inputBorderFocus: '#6366f1',
                                                },
                                                space: {
                                                    spaceSmall: '4px',
                                                    spaceMedium: '8px',
                                                    spaceLarge: '16px',
                                                    labelBottomMargin: '8px',
                                                    anchorBottomMargin: '4px',
                                                    emailInputSpacing: '4px',
                                                    socialAuthSpacing: '4px',
                                                    buttonPadding: '10px 15px',
                                                    inputPadding: '10px 15px',
                                                },
                                                fontSizes: {
                                                    baseBodySize: '13px',
                                                    baseInputSize: '14px',
                                                    baseLabelSize: '14px',
                                                    baseButtonSize: '14px',
                                                },
                                                radii: {
                                                    borderRadiusButton: '8px',
                                                    buttonBorderRadius: '8px',
                                                    inputBorderRadius: '8px',
                                                },
                                            },
                                        },
                                        className: {
                                            container: 'text-white',
                                            button: 'text-white hover:bg-indigo-700 ',
                                            input: 'text-white !bg-[#151b24] border !border-[#14495a] focus:!border-[#6366f1]',
                                            label: 'hidden',
                                            message: 'text-gray-400',
                                        },
                                    }}
                                    theme="dark"
                                    providers={['google', 'github', 'twitter', 'facebook', 'discord']}
                                    redirectTo={redirectUrl}
                                    view={selectedRole ? 'sign_in' : undefined}
                                    disabled={!selectedRole}
                                />

                                {/* Role selection reminder */}
                                {!selectedRole && (
                                    <div className="text-center text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded-lg border-yellow-800/30">
                                        Please select your role (Backer or Founder) to continue
                                    </div>
                                )}

                                {/* Submit button to save role */}
                                <button
                                    onClick={() => {
                                        if (user) {
                                            // Default role is backer if none selected
                                            const role = selectedRole || 'backer';
                                            localStorage.setItem('userRole', role);
                                            updateUserRole(role);
                                            router.push('/');
                                        } else {
                                            alert('Please log in first');
                                        }
                                    }}
                                    disabled={!user || !selectedRole}
                                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${user && selectedRole
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Continue as {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

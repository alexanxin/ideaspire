"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import IdeaCard from '@/components/IdeaCard';
import { PropagateLoader } from 'react-spinners';

export default function ResponsiveIdeaView({
    ideas,
    onIdeaClick,
    onLoadMore,
    hasMore,
    loading,
    searchTerm,
    selectedCategory,
    tier,
    limits
}) {
    const loaderRef = useRef(null);


    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!hasMore || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target.isIntersecting && onLoadMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, loading, onLoadMore]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Grid view with masonry layout */}
            <div className="flex-grow min-h-0">
                <div className="h-full flex flex-col">
                    {ideas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {ideas.map((idea, index) => (
                                <div key={idea.id} className="flex">
                                    <IdeaCard
                                        idea={idea}
                                        onIdeaClick={onIdeaClick}
                                        onCategoryClick={(category) => {
                                            // This would need to be passed from parent if we want to support category filtering from cards
                                        }}
                                        tier={tier}
                                        limits={limits}
                                    />
                                </div>
                            ))}
                            {/* Intersection Observer trigger */}
                            <div ref={loaderRef} className="col-span-full h-10 flex items-center justify-center w-full">
                                {loading && (
                                    <PropagateLoader color="#4f46e5" />
                                )}
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center flex-grow">
                            <PropagateLoader color="#4f46e5" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No ideas found</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Try adjusting your search or filter criteria
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

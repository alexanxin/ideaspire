import { useState, useEffect } from 'react';
import { Clock, Heart, Eye, Copy, Share2, Zap, RotateCcw, MessageCircle } from 'lucide-react';
import { PropagateLoader } from 'react-spinners';

const ActivityLog = ({ userId }) => {
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(null);

    // Map interaction types to icons and colors
    const getIconAndColor = (type) => {
        switch (type) {
            case 'like':
                return { icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500/10' };
            case 'reveal':
                return { icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
            case 'copy':
                return { icon: Copy, color: 'text-green-500', bgColor: 'bg-green-500/10' };
            case 'share':
                return { icon: Share2, color: 'text-purple-500', bgColor: 'bg-purple-500/10' };
            case 'view':
                return { icon: Eye, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
            case 'spin':
                return { icon: RotateCcw, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' };
            default:
                return { icon: MessageCircle, color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
        }
    };

    const fetchActivityLog = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
            } else if (loadingMore) {
                return; // Prevent multiple simultaneous requests
            }

            const offset = reset ? 0 : page * 10;
            const response = await fetch(`/api/profile/activity-log?limit=10&offset=${offset}`);

            if (!response.ok) {
                throw new Error('Failed to fetch activity log');
            }

            const data = await response.json();

            if (reset) {
                setActivityLog(data.activityLog || []);
                setPage(1);
            } else {
                setActivityLog(prev => [...prev, ...(data.activityLog || [])]);
                setPage(prev => prev + 1);
            }

            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Error fetching activity log:', err);
            setError(err.message);
        } finally {
            if (reset) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    // Initial fetch
    useEffect(() => {
        if (userId) {
            fetchActivityLog(true);
        }
    }, [userId]);

    // Infinite scroll setup
    useEffect(() => {
        if (!hasMore || loadingMore) return;

        const sentinel = document.getElementById('activity-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    setLoadingMore(true);
                    fetchActivityLog(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loadingMore]);

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Error loading activity: {error}</p>
            </div>
        );
    }

    if (loading && activityLog.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <PropagateLoader color="#4f46e5" />
            </div>
        );
    }

    if (activityLog.length === 0) {
        return (
            <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No activity yet</h3>
                <p className="text-gray-500">Your interactions will appear here</p>
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-4">
                {activityLog.map((activity) => {
                    const { icon: Icon, color, bgColor } = getIconAndColor(activity.interactionType);

                    return (
                        <div
                            key={activity.id}
                            className="flex items-start p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                        >
                            <div className={`flex-shrink-0 p-2 rounded-full ${bgColor}`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <h4 className="text-white font-medium">{activity.activityTitle}</h4>
                                <p className="text-gray-400 text-sm mt-1">{activity.activityDescription}</p>
                                {activity.ideaCategory && (
                                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                                        {activity.ideaCategory}
                                    </span>
                                )}
                                <p className="text-gray-500 text-xs mt-2">{activity.formattedDate}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loadingMore && (
                <div className="flex flex-col items-center justify-center py-8">
                    <PropagateLoader color="#4f46e5" size={12} />
                    <p className="text-gray-400 mt-2">Loading more activity...</p>
                </div>
            )}

            {hasMore && !loadingMore && (
                <div id="activity-sentinel" className="h-4"></div>
            )}

            {!hasMore && activityLog.length > 0 && (
                <div className="text-center py-6">
                    <p className="text-gray-500">You have reached the end of your activity log</p>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;

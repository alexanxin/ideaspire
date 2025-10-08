export const formatDate = (date) => {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
};

export const getCurrentDate = () => {
    return new Date();
};

export const formatDateForDatabase = (date) => {
    return date.toISOString().split('T')[0];
};
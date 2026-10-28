export const mealsLabel = (count) => `${count} ${count === 1 ? 'meal' : 'meals'}`;
export const statusTone = (status) => ({ Available:'green', Requested:'orange', Accepted:'blue', Completed:'green' }[status] || 'orange');

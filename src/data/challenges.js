export const CHALLENGES = [
    {
        type: 'trivia',
        question: 'How much CO₂ does a single train ride save compared to driving 50km?',
        options: ['~2 kg', '~5 kg', '~8 kg', '~12 kg'],
        correctIndex: 3,
        explanation: 'Trains are incredibly efficient! A 50km solo car trip emits about 12.5kg of CO₂, while a train emits less than 2kg.',
        points: 5
    },
    {
        type: 'challenge',
        question: 'Challenge: Walk or bike instead of driving for a short trip today.',
        explanation: 'Short car trips (under 2 miles) are highly polluting because cold engines burn fuel less efficiently.',
        points: 10
    },
    {
        type: 'trivia',
        question: 'What percentage of global emissions come from transportation?',
        options: ['12%', '24%', '35%', '45%'],
        correctIndex: 1,
        explanation: 'Transportation accounts for roughly 24% of direct CO₂ emissions from fuel combustion worldwide.',
        points: 5
    },
    {
        type: 'challenge',
        question: 'Challenge: Bring a reusable water bottle today instead of buying a plastic one.',
        explanation: 'It takes 3 times the amount of water to make a plastic bottle than it does to fill it.',
        points: 5
    },
    {
        type: 'trivia',
        question: 'Which of these travel methods is generally the most carbon-intensive per passenger?',
        options: ['Domestic Flight', 'Long-haul Flight', 'Solo Car Ride', 'Bus'],
        correctIndex: 0,
        explanation: 'Domestic flights are highly carbon-intensive because take-off and landing use the most fuel over a short distance.',
        points: 5
    }
];

export const getDailyChallenge = () => {
    // Deterministic random based on date
    const dateStr = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % CHALLENGES.length;
    return CHALLENGES[index];
};

// Simple mock OCR receipt parser
// Detects keywords in the raw text and generates a mock parsed receipt

const ECO_KEYWORDS = [
    'metro',
    'vegan',
    'railway',
    'bicycle',
    'solar',
    'train',
    'plant-based',
    'bus',
    'subway',
    'transit',
    'tram',
    'ev charging',
    'farmers market',
    'secondhand',
    'thrift',
    'organic'
];

export const checkEcoFriendly = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return ECO_KEYWORDS.some(keyword => lowerText.includes(keyword));
};

export const parseReceipt = async (imageUri) => {
    // In a real app, we would send the imageUri to Google Cloud Vision, AWS Textract, or a local ML model.
    // For this prototype, we'll simulate a 1.5s OCR parsing delay and return deterministic mock data based on the filename or random seed.
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate some random realistic mock data
            const isEcoMock = Math.random() > 0.5;
            
            const merchants = isEcoMock ? 
                ['City Metro Transit', 'Green Leaf Vegan Cafe', 'Amtrak Railway', 'Lime Bike Share', 'Organic Farmers Market'] :
                ['Starbucks', 'Uber Ride', 'McDonalds', 'Shell Gas Station', 'Target'];
                
            const merchant = merchants[Math.floor(Math.random() * merchants.length)];
            const amount = (Math.random() * 50 + 5).toFixed(2);
            
            // Generate raw text that contains keywords if it's an eco mock
            const rawText = `
                ${merchant.toUpperCase()}
                Date: ${new Date().toLocaleDateString()}
                Time: ${new Date().toLocaleTimeString()}
                
                1x Ticket/Item        ${amount}
                Tax                   ${(amount * 0.08).toFixed(2)}
                
                TOTAL                 ${(parseFloat(amount) + parseFloat(amount * 0.08)).toFixed(2)}
                
                Thank you for your business!
            `.trim();
            
            const isEcoFriendly = checkEcoFriendly(merchant + " " + rawText);

            resolve({
                merchant,
                amount: (parseFloat(amount) + parseFloat(amount * 0.08)).toFixed(2),
                rawText,
                isEcoFriendly
            });
        }, 1500);
    });
};

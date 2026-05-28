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

export const parseReceipt = async (base64Image) => {
    try {
        let formData = new FormData();
        formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
        formData.append('apikey', 'helloworld');
        formData.append('isTable', 'true');
        formData.append('OCREngine', '2');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        
        if (data.IsErroredOnProcessing || !data.ParsedResults || data.ParsedResults.length === 0) {
            throw new Error('Failed to parse image');
        }

        const text = data.ParsedResults[0].ParsedText || '';
        
        // Extract amount: look for the highest number with a decimal
        const amounts = text.match(/\b\d+\.\d{2}\b/g) || [];
        const maxAmount = amounts.length > 0 ? Math.max(...amounts.map(Number)) : 0;
        
        // Extract merchant: usually the first non-empty line
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 3 && !l.match(/^\d/));
        const merchant = lines.length > 0 ? lines[0] : 'Unknown Merchant';
        
        const isEcoFriendly = checkEcoFriendly(text);

        return {
            merchant: merchant.substring(0, 30),
            amount: maxAmount > 0 ? maxAmount.toFixed(2) : '',
            rawText: text,
            isEcoFriendly
        };
    } catch (e) {
        console.error('OCR Error:', e);
        throw e;
    }
};

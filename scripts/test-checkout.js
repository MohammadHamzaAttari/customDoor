import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/quick-checkout';

async function testCheckout() {
    console.log('Testing checkout flow...');

    const payload = {
        items: [
            {
                width: 600,
                height: 720,
                thickness: 22,
                panelType: "STANDARD_12MM",
                finish: "RAW_UNASSEMBLED",
                price: 35.40,
                quantity: 1,
                category: "shaker",
                hingeDrilling: false,
                midRailsEnabled: false
            }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Checkout Test Passed!');
            console.log('Redirect URL:', data.invoiceUrl);
        } else {
            console.error('❌ Checkout Test Failed:', data.message || 'Unknown error');
            if (response.status === 500 && data.message.includes('credentials')) {
                console.error('>> Missing Shopify Credentials in environment.');
            }
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testCheckout();

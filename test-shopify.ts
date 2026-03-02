import * as dotenv from "dotenv";
dotenv.config();

const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function testShopifyImage() {
    console.log("Testing Shopify API...");
    const url = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01/products.json`;

    // 1x1 transparent PNG base64
    const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    const productPayload = {
        product: {
            title: "Test Image Product",
            body_html: "Testing base64 image upload",
            vendor: "Custom Door Designer",
            product_type: "Test",
            status: "active",
            variants: [
                {
                    price: "10.00",
                }
            ],
            images: [
                {
                    attachment: testBase64,
                    filename: `test-image-${Date.now()}.png`
                }
            ]
        }
    };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
            },
            body: JSON.stringify(productPayload),
        });

        if (!res.ok) {
            console.error("Failed to create product:", await res.text());
            return;
        }

        const data = await res.json();
        console.log("Product created successfully!");
        const product = data.product;
        const variant = product.variants[0];
        const image = product.images?.[0];

        console.log(`Product ID: ${product.id}`);
        console.log(`Variant ID: ${variant.id}`);
        console.log(`Image ID: ${image?.id}`);

        if (image && variant) {
            const variantUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01/variants/${variant.id}.json`;
            const variantRes = await fetch(variantUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
                },
                body: JSON.stringify({
                    variant: {
                        id: variant.id,
                        image_id: image.id
                    }
                })
            });

            if (variantRes.ok) {
                console.log("Successfully linked image to variant!");
            } else {
                console.error("Failed to link image:", await variantRes.text());
            }
        }

    } catch (e) {
        console.error(e);
    }
}

testShopifyImage();

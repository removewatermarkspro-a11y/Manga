export default function StructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AI Comic Generator",
        "description": "Create personalized comics and manga where you are the hero using AI technology",
        "url": "https://aicomicgenerator.com",
        "applicationCategory": "DesignApplication",
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "EUR",
            "lowPrice": "9.99",
            "highPrice": "59.99",
            "offerCount": "3"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "ratingCount": "20000",
            "bestRating": "5",
            "worstRating": "1"
        },
        "featureList": [
            "AI-powered comic generation",
            "Multiple art styles (Comic, Manga, Manhwa)",
            "5 popular universes (Star Wars, Disney, Naruto, DBZ, Harry Potter)",
            "High-resolution output",
            "Physical book printing option",
            "Story generation with 'Inspire Me' feature"
        ],
        "creator": {
            "@type": "Organization",
            "name": "AI Comic Generator",
            "url": "https://aicomicgenerator.com"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

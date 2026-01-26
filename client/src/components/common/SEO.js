import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Pokisham';
const DEFAULT_DESCRIPTION = 'Discover unique handcrafted treasures at Pokisham. Handmade products, custom frames, pottery, and traditional Golu Bommai. Free shipping on orders above ₹999.';
const DEFAULT_IMAGE = 'https://www.pokisham.com/logo512.png';
const SITE_URL = 'https://www.pokisham.com';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = 'handcrafted gifts, South Indian gifts, custom frames, pottery, Golu Bommai, handmade products, Pokisham, online shopping India',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  jsonLd,
}) => {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Handcrafted Treasures`;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

export type Language = 'en' | 'hi' | 'pa';

export const translations = {
  en: {
    nav: {
      brand: 'NyayaSetu India',
      tagline: 'National Legal Services eMarketplace',
      findProvider: 'Find Legal Counsel',
      forAdvocates: 'For Advocates & Notaries',
      login: 'Sign In',
      register: 'Join Platform',
      onboarding: 'LSP Onboarding',
      dashboard: 'Dashboard',
      disclaimer: 'BCI Rule 36 Compliant Directory',
    },
    hero: {
      title: 'Equitable Access to Verified Legal Services Across India',
      subtitle:
        'Connect directly with Bar Council verified advocates, licensed notaries, accredited mediators, and document writers. Transparent statutory pricing, escrow protection, and zero touts.',
      searchPlaceholder: 'Search by legal problem (e.g. land partition, consumer grievance, bail)...',
      searchButton: 'Search Verified Counsel',
      statProviders: '12,500+ Verified Practitioners',
      statDistricts: '680+ Districts Covered',
      statDisputes: '98.4% Resolution Satisfaction',
    },
    categories: {
      title: 'Statutory Practice Areas & Specialized Services',
      property: 'Land & Property Disputes',
      propertyDesc: 'Revenue records, partition suits, title searches, mutation disputes.',
      family: 'Family & Matrimonial',
      familyDesc: 'Divorce, custody, maintenance, Hindu Marriage Act, Special Marriage Act.',
      criminal: 'Criminal Defense & Bail',
      criminalDesc: 'Anticipatory bail, FIR quashing, CrPC proceedings, trial representation.',
      notary: 'Notarial & Attestation Services',
      notaryDesc: 'Statutory affidavits, power of attorney, apostille, verification under Notaries Act.',
      mediation: 'Mediation & Conciliation',
      mediationDesc: 'Court-annexed mediation, commercial conciliation under Mediation Act 2023.',
      documents: 'Drafting & Petition Writing',
      documentsDesc: 'Tehsil deeds, sale agreements, lease deeds, legal notices.',
    },
    onboarding: {
      title: 'Legal Service Provider Onboarding Wizard',
      step1: 'Basic Details',
      step2: 'Professional Credentials',
      step3: 'Document Vault',
      step4: 'Statutory Declaration',
      submitReview: 'Submit for Bar Verification',
      bciNotice:
        'Pursuant to Rule 36 of Bar Council of India Rules, this listing is factual and informational. Solicitation or commercial advertising is strictly prohibited.',
    },
    compliance: {
      banner:
        'Regulatory Compliance: NyayaSetu operates strictly as a digital directory and communications infrastructure pursuant to Bar Council of India Rule 36 & DPDP Act 2023. The platform does not solicit work, rank lawyers by commercial payment, or offer legal advice.',
      rightsReserved: 'NyayaSetu India • National Digital Legal Services eMarketplace • Ministry of Law & Justice.',
    },
  },
  hi: {
    nav: {
      brand: 'न्यायसेतु भारत',
      tagline: 'राष्ट्रीय विधिक सेवा ई-मार्केटप्लेस',
      findProvider: 'वकील खोजें',
      forAdvocates: 'अधिवक्ताओं एवं नोटरी हेतु',
      login: 'लॉग इन',
      register: 'पंजीकरण करें',
      onboarding: 'ऑनबोर्डिंग',
      dashboard: 'डैशबोर्ड',
      disclaimer: 'बीसीआई नियम 36 अनुपालन डायरेक्टरी',
    },
    hero: {
      title: 'भारत भर में सत्यापित कानूनी सेवाओं तक निष्पक्ष और पारदर्शी पहुंच',
      subtitle:
        'बार काउंसिल सत्यापित अधिवक्ताओं, अधिकृत नोटरी, मध्यस्थों और दस्तावेज़ लेखकों से सीधे जुड़ें। एस्क्रो सुरक्षा और बिना किसी दलाली के निष्पक्ष विधिक सहायता।',
      searchPlaceholder: 'कानूनी समस्या खोजें (जैसे ज़मीन विवाद, उपभोक्ता मामला, शपथ पत्र)...',
      searchButton: 'वकील खोजें',
      statProviders: '12,500+ सत्यापित वकील',
      statDistricts: '680+ ज़िले सम्मिलित',
      statDisputes: '98.4% समाधान संतुष्टि',
    },
    categories: {
      title: 'प्रमुख कानूनी श्रेणियां एवं विधिक सेवाएं',
      property: 'भूमि एवं संपत्ति विवाद',
      propertyDesc: 'राजस्व रिकॉर्ड, विभाजन वाद, खतौनी विवाद, रजिस्ट्री जांच।',
      family: 'पारिवारिक एवं वैवाहिक मामले',
      familyDesc: 'तलाक, भरण-पोषण, संरक्षकता, हिंदू विवाह अधिनियम।',
      criminal: 'आपराधिक बचाव एवं जमानत',
      criminalDesc: 'अग्रिम जमानत, एफआईआर निरस्तीकरण, ट्रायल प्रतिनिधित्व।',
      notary: 'नोटरी एवं सत्यापन सेवाएं',
      notaryDesc: 'शपथ पत्र, मुख्तारनामा, नोटरी अधिनियम के तहत सत्यापन।',
      mediation: 'सुलह एवं मध्यस्थता',
      mediationDesc: 'मध्यस्थता अधिनियम 2023 के तहत न्यायालय-संलग्न सुलह।',
      documents: 'दस्तावेज़ लेखन एवं याचिका',
      documentsDesc: 'तहसील विलेख, विक्रय पत्र, पट्टा, कानूनी नोटिस।',
    },
    onboarding: {
      title: 'विधिक सेवा प्रदाता ऑनबोर्डिंग विज़ार्ड',
      step1: 'मूल विवरण',
      step2: 'व्यावसायिक साख',
      step3: 'दस्तावेज़ वॉल्ट',
      step4: 'सांविधिक घोषणा',
      submitReview: 'सत्यापन हेतु भेजें',
      bciNotice:
        'बार काउंसिल ऑफ इंडिया नियम 36 के अनुसार यह केवल तथ्यात्मक डायरेक्टरी है। किसी भी प्रकार का विज्ञापन या मुकदमों की याचना प्रतिबंधित है।',
    },
    compliance: {
      banner:
        'सांविधिक सूचना: न्यायसेतु बार काउंसिल ऑफ इंडिया के नियम 36 एवं डीपीडीपी अधिनियम 2023 के अनुसार केवल एक तटस्थ डिजिटल डायरेक्टरी है। यह मंच वकालत की सलाह या वकीलों की रैंकिंग नहीं बेचता है।',
      rightsReserved: 'डिजिटल इंडिया विधिक सहायता पहल।',
    },
  },
  pa: {
    nav: {
      brand: 'ਨਿਆਂਸੇਤੂ ਭਾਰਤ',
      tagline: 'ਰਾਸ਼ਟਰੀ ਕਾਨੂੰਨੀ ਸੇਵਾਵਾਂ ਈ-ਮਾਰਕਿਟਪਲੇਸ',
      findProvider: 'ਵਕੀਲ ਲੱਭੋ',
      forAdvocates: 'ਵਕੀਲਾਂ ਅਤੇ ਨੋਟਰੀਆਂ ਲਈ',
      login: 'ਲਾਗ ਇਨ',
      register: 'ਰਜਿਸਟਰ ਕਰੋ',
      onboarding: 'ਆਨਬੋਰਡਿੰਗ',
      dashboard: 'ਡੈਸ਼ਬੋਰਡ',
      disclaimer: 'ਬਾਰ ਕੌਂਸਲ ਨਿਯਮ 36 ਅਨੁਕੂਲ',
    },
    hero: {
      title: 'ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਪ੍ਰਮਾਣਿਤ ਕਾਨੂੰਨੀ ਸੇਵਾਵਾਂ ਤੱਕ ਭਰੋਸੇਮੰਦ ਪਹੁੰਚ',
      subtitle:
        'ਬਾਰ ਕੌਂਸਲ ਤੋਂ ਪ੍ਰਮਾਣਿਤ ਵਕੀਲਾਂ, ਲਾਇਸੰਸਸ਼ੁਦਾ ਨੋਟਰੀਆਂ ਅਤੇ ਦਸਤਾਵੇਜ਼ ਲੇਖਕਾਂ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰੋ। ਬਿਨਾਂ ਦਲਾਲਾਂ ਦੇ ਪਾਰਦਰਸ਼ੀ ਫੀਸ ਅਤੇ ਸੁਰੱਖਿਅਤ ਸੇਵਾਵਾਂ।',
      searchPlaceholder: 'ਕਾਨੂੰਨੀ ਮਸਲਾ ਖੋਜੋ (ਜ਼ਮੀਨੀ ਵੰਡ, ਜ਼ਮਾਨਤ, ਖੇਤੀਬਾੜੀ ਰਿਕਾਰਡ)...',
      searchButton: 'ਵਕੀਲ ਲੱਭੋ',
      statProviders: '12,500+ ਪ੍ਰਮਾਣਿਤ ਵਕੀਲ',
      statDistricts: '680+ ਜ਼ਿਲ੍ਹੇ ਸ਼ਾਮਲ',
      statDisputes: '98.4% ਸੰਤੁਸ਼ਟੀ ਦਰ',
    },
    categories: {
      title: 'ਕਾਨੂੰਨੀ ਖੇਤਰ ਅਤੇ ਵਿਸ਼ੇਸ਼ ਸੇਵਾਵਾਂ',
      property: 'ਜ਼ਮੀਨ ਅਤੇ ਜਾਇਦਾਦ ਦੇ ਝਗੜੇ',
      propertyDesc: 'ਮਾਲ ਰਿਕਾਰਡ, ਤਕਸੀਮ, ਇੰਤਕਾਲ, ਜ਼ਮੀਨੀ ਮਾਲਕੀ ਜਾਂਚ।',
      family: 'ਪਰਿਵਾਰਕ ਅਤੇ ਘਰੇਲੂ ਮਾਮਲੇ',
      familyDesc: 'ਤਲਾਕ, ਗੁਜ਼ਾਰਾ ਭੱਤਾ, ਬੱਚਿਆਂ ਦੀ ਕਸਟਡੀ।',
      criminal: 'ਫੌਜਦਾਰੀ ਬਚਾਅ ਅਤੇ ਜ਼ਮਾਨਤ',
      criminalDesc: 'ਅਗਾਊਂ ਜ਼ਮਾਨਤ, ਐਫ.ਆਈ.ਆਰ ਰੱਦ ਕਰਵਾਉਣਾ, ਅਦਾਲਤੀ ਕਾਰਵਾਈ।',
      notary: 'ਨੋਟਰੀ ਅਤੇ ਤਸਦੀਕ ਸੇਵਾਵਾਂ',
      notaryDesc: 'ਹਲਫ਼ਨਾਮੇ, ਮੁਖ਼ਤਿਆਰਨਾਮਾ, ਨੋਟਰੀ ਐਕਟ ਤਹਿਤ ਤਸਦੀਕ।',
      mediation: 'ਸਾਲਸੀ ਅਤੇ ਵਿਚੋਲਗੀ',
      mediationDesc: 'ਵਿਚੋਲਗੀ ਐਕਟ 2023 ਅਧੀਨ ਆਪਸੀ ਰਾਜ਼ੀਨਾਮਾ।',
      documents: 'ਦਸਤਾਵੇਜ਼ ਅਤੇ ਅਰਜ਼ੀ ਲੇਖਣ',
      documentsDesc: 'ਤਹਿਸੀਲ ਦਸਤਾਵੇਜ਼, ਬਿਆਨਾ, ਕਿਰਾਇਆਨਾਮਾ, ਕਾਨੂੰਨੀ ਨੋਟਿਸ।',
    },
    onboarding: {
      title: 'ਕਾਨੂੰਨੀ ਸੇਵਾ ਪ੍ਰਦਾਤਾ ਆਨਬੋਰਡਿੰਗ',
      step1: 'ਮੁੱਢਲਾ ਵੇਰਵਾ',
      step2: 'ਪੇਸ਼ੇਵਰ ਯੋਗਤਾ',
      step3: 'ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ',
      step4: 'ਕਾਨੂੰਨੀ ਘੋਸ਼ਣਾ',
      submitReview: 'ਪੜਤਾਲ ਲਈ ਭੇਜੋ',
      bciNotice:
        'ਬਾਰ ਕੌਂਸਲ ਆਫ਼ ਇੰਡੀਆ ਨਿਯਮ 36 ਅਨੁਸਾਰ ਇਹ ਕੇਵਲ ਜਾਣਕਾਰੀ ਡਾਇਰੈਕਟਰੀ ਹੈ। ਕੋਈ ਵੀ ਇਸ਼ਤਿਹਾਰਬਾਜ਼ੀ ਪੂਰੀ ਤਰ੍ਹਾਂ ਵਰਜਿਤ ਹੈ।',
    },
    compliance: {
      banner:
        'ਸੰਵਿਧਾਨਕ ਸੂਚਨਾ: ਨਿਆਂਸੇਤੂ ਬਾਰ ਕੌਂਸਲ ਆਫ਼ ਇੰਡੀਆ ਨਿਯਮ 36 ਅਤੇ ਡੀਪੀਡੀਪੀ ਐਕਟ 2023 ਤਹਿਤ ਸਿਰਫ਼ ਇੱਕ ਡਿਜੀਟਲ ਡਾਇਰੈਕਟਰੀ ਵਜੋਂ ਕੰਮ ਕਰਦਾ ਹੈ।',
      rightsReserved: 'ਡਿਜੀਟਲ ਇੰਡੀਆ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਪ੍ਰੋਗਰਾਮ।',
    },
  },
};


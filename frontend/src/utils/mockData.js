// Mock data matching the backend Article model structure
export const mockNewsData = [
  {
    guardian_id: 'technology/2025/oct/21/ai-healthcare-breakthrough',
    section_id: 'technology',
    section_name: 'Technology',
    web_title: 'Revolutionary AI Technology Transforms Healthcare Industry',
    web_url: 'https://www.theguardian.com/technology/2025/oct/21/ai-healthcare-breakthrough',
    api_url: 'https://content.guardianapis.com/technology/2025/oct/21/ai-healthcare-breakthrough',
    headline: 'Revolutionary AI Technology Transforms Healthcare Industry',
    trail_text: 'New artificial intelligence system helps doctors diagnose diseases with unprecedented accuracy, potentially saving millions of lives worldwide.',
    body_text: 'New artificial intelligence system helps doctors diagnose diseases with unprecedented accuracy, potentially saving millions of lives worldwide. The breakthrough technology combines machine learning with medical imaging to detect early signs of diseases that human doctors might miss.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-23T10:30:00Z',
    last_modified: '2025-10-22T10:30:00Z',
    tags: [
      { id: 'technology/ai', webTitle: 'Artificial Intelligence' },
      { id: 'technology/healthcare', webTitle: 'Healthcare Technology' }
    ],
    authors: [
      { firstName: 'Sarah', lastName: 'Johnson', webTitle: 'Sarah Johnson' }
    ]
  },
  {
    guardian_id: 'business/2025/oct/21/global-markets-surge',
    section_id: 'business',
    section_name: 'Business',
    web_title: 'Global Markets Surge on Positive Economic Data',
    web_url: 'https://www.theguardian.com/business/2025/oct/21/global-markets-surge',
    api_url: 'https://content.guardianapis.com/business/2025/oct/21/global-markets-surge',
    headline: 'Global Markets Surge on Positive Economic Data',
    trail_text: 'Stock markets around the world rally as new economic indicators show stronger than expected growth in key sectors.',
    body_text: 'Stock markets around the world rally as new economic indicators show stronger than expected growth in key sectors. Investors showed renewed confidence as manufacturing data exceeded expectations.',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-22T08:15:00Z',
    last_modified: '2025-10-22T08:15:00Z',
    tags: [
      { id: 'business/stock-markets', webTitle: 'Stock Markets' },
      { id: 'business/economics', webTitle: 'Economics' }
    ],
    authors: [
      { firstName: 'Michael', lastName: 'Chen', webTitle: 'Michael Chen' }
    ]
  },
  {
    guardian_id: 'sport/2025/oct/20/championship-finals-historic-victory',
    section_id: 'sport',
    section_name: 'Sport',
    web_title: 'Championship Finals: Underdog Team Secures Historic Victory',
    web_url: 'https://www.theguardian.com/sport/2025/oct/20/championship-finals-historic-victory',
    api_url: 'https://content.guardianapis.com/sport/2025/oct/20/championship-finals-historic-victory',
    headline: 'Championship Finals: Underdog Team Secures Historic Victory',
    trail_text: 'In a stunning upset, the underdog team defeats the reigning champions in a thrilling overtime match that will be remembered for years.',
    body_text: 'In a stunning upset, the underdog team defeats the reigning champions in a thrilling overtime match that will be remembered for years. The victory came after a nail-biting overtime period.',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-22T06:45:00Z',
    last_modified: '2025-10-22T06:45:00Z',
    tags: [
      { id: 'sport/championship', webTitle: 'Championship' },
      { id: 'sport/football', webTitle: 'Football' }
    ],
    authors: [
      { firstName: 'James', lastName: 'Williams', webTitle: 'James Williams' }
    ]
  },
  {
    guardian_id: 'film/2025/oct/20/blockbuster-box-office-records',
    section_id: 'film',
    section_name: 'Film',
    web_title: 'Blockbuster Movie Breaks Box Office Records',
    web_url: 'https://www.theguardian.com/film/2025/oct/20/blockbuster-box-office-records',
    api_url: 'https://content.guardianapis.com/film/2025/oct/20/blockbuster-box-office-records',
    headline: 'Blockbuster Movie Breaks Box Office Records',
    trail_text: 'The highly anticipated sequel exceeds all expectations, earning over $300 million in its opening weekend worldwide.',
    body_text: 'The highly anticipated sequel exceeds all expectations, earning over $300 million in its opening weekend worldwide. The film has broken multiple records across international markets.',
    thumbnail: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-22T14:20:00Z',
    last_modified: '2025-10-22T14:20:00Z',
    tags: [
      { id: 'film/box-office', webTitle: 'Box Office' },
      { id: 'film/action', webTitle: 'Action Films' }
    ],
    authors: [
      { firstName: 'Emma', lastName: 'Davis', webTitle: 'Emma Davis' }
    ]
  },
  {
    guardian_id: 'science/2025/oct/20/rare-disease-cure-discovery',
    section_id: 'science',
    section_name: 'Science',
    web_title: 'Scientists Discover Potential Cure for Rare Disease',
    web_url: 'https://www.theguardian.com/science/2025/oct/20/rare-disease-cure-discovery',
    api_url: 'https://content.guardianapis.com/science/2025/oct/20/rare-disease-cure-discovery',
    headline: 'Scientists Discover Potential Cure for Rare Disease',
    trail_text: 'Breakthrough research at leading university shows promising results in treating a previously incurable genetic condition.',
    body_text: 'Breakthrough research at leading university shows promising results in treating a previously incurable genetic condition. The study involved years of genetic research and clinical trials.',
    thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-20T12:00:00Z',
    last_modified: '2025-10-20T12:00:00Z',
    tags: [
      { id: 'science/medical-research', webTitle: 'Medical Research' },
      { id: 'science/genetics', webTitle: 'Genetics' }
    ],
    authors: [
      { firstName: 'Dr. Lisa', lastName: 'Martinez', webTitle: 'Dr. Lisa Martinez' }
    ]
  },
  {
    guardian_id: 'lifeandstyle/2025/oct/19/mediterranean-diet-benefits',
    section_id: 'lifeandstyle',
    section_name: 'Life and style',
    web_title: 'New Study Reveals Benefits of Mediterranean Diet',
    web_url: 'https://www.theguardian.com/lifeandstyle/2025/oct/19/mediterranean-diet-benefits',
    api_url: 'https://content.guardianapis.com/lifeandstyle/2025/oct/19/mediterranean-diet-benefits',
    headline: 'New Study Reveals Benefits of Mediterranean Diet',
    trail_text: 'Long-term research confirms that Mediterranean diet significantly reduces risk of heart disease and extends life expectancy.',
    body_text: 'Long-term research confirms that Mediterranean diet significantly reduces risk of heart disease and extends life expectancy. The study followed thousands of participants over 10 years.',
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-19T14:30:00Z',
    last_modified: '2025-10-19T14:30:00Z',
    tags: [
      { id: 'lifeandstyle/health', webTitle: 'Health & Wellness' },
      { id: 'lifeandstyle/food', webTitle: 'Food' }
    ],
    authors: [
      { firstName: 'Rachel', lastName: 'Thompson', webTitle: 'Rachel Thompson' }
    ]
  },
  {
    guardian_id: 'politics/2025/oct/19/infrastructure-investment-plan',
    section_id: 'politics',
    section_name: 'Politics',
    web_title: 'Government Announces Major Infrastructure Investment Plan',
    web_url: 'https://www.theguardian.com/politics/2025/oct/19/infrastructure-investment-plan',
    api_url: 'https://content.guardianapis.com/politics/2025/oct/19/infrastructure-investment-plan',
    headline: 'Government Announces Major Infrastructure Investment Plan',
    trail_text: 'New $500 billion initiative aims to modernize transportation systems and create thousands of jobs across the nation.',
    body_text: 'New $500 billion initiative aims to modernize transportation systems and create thousands of jobs across the nation. The comprehensive plan includes roads, bridges, and public transit improvements.',
    thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=500&h=300&fit=crop',
    first_publication_date: '2025-10-19T09:00:00Z',
    last_modified: '2025-10-19T09:00:00Z',
    tags: [
      { id: 'politics/infrastructure', webTitle: 'Infrastructure' },
      { id: 'politics/government', webTitle: 'Government Policy' }
    ],
    authors: [
      { firstName: 'David', lastName: 'Anderson', webTitle: 'David Anderson' }
    ]
  }
]

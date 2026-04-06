export interface ContentFormatSuitability {
  suitability: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface Fact {
  claim: string;
  source: string;
  verified: boolean;
}

export interface Idea {
  id: string;
  slug: string;
  title: string;
  category: string;
  hookAngle: string;
  keyMessage: string;
  facts: Fact[];
  suggestedHooks: string[];
  visualConcepts: string[];
  contentFormats: {
    reel: ContentFormatSuitability;
    ugc: ContentFormatSuitability;
    carousel: ContentFormatSuitability;
    infographic: ContentFormatSuitability;
    [key: string]: ContentFormatSuitability;
  };
  priority: 'normal' | 'high' | 'banger';
  tags: string[];
  domainData?: Record<string, unknown>;
  createdAt: string;
  generationStatus: {
    [format: string]: string | null;
  };
}

export interface IdeasBank {
  ideas: Idea[];
  lastUpdated: string;
}

export type ContentFormat = 'reel' | 'ugc' | 'carousel' | 'infographic' | string;

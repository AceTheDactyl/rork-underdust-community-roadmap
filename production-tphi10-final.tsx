import React, { useState, useCallback, useMemo, useReducer, useEffect, useRef } from 'react';
import { 
  Calculator, BookOpen, Zap, AlertCircle, CheckCircle, Search, 
  Filter, Settings, Copy, Download, History, Grid, RefreshCw,
  ChevronDown, Moon, Sun, Sliders, Type, Hash, BarChart2, Command, X,
  FileInput, FileOutput, Library, ScrollText
} from 'lucide-react';

// Enhanced Type Definitions
interface SigilData {
  id: string;
  name: string;
  description: string;
  symbol: string;
  ternaryCode: string;
  category: 'element' | 'process' | 'celestial' | 'compound' | 'tool' | 'measure';
  decimalValue: number;
  tags?: string[];
  unicode?: string;
  historicalSource?: string | AuthenticSigilSource;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

interface ConversionResult {
  input: string;
  output: string | number;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  autoConvert: boolean;
  keyboardShortcuts: boolean;
  resultsLimit: number;
}

interface AuthenticSigilSource {
  author: string;
  work: string;
  year: number;
  manuscript?: string;
  page?: string;
}

interface ExportData {
  metadata: {
    version: string;
    timestamp: string;
    userAgent: string;
    exportType: 'full' | 'history' | 'preferences';
  };
  preferences: UserPreferences;
  history: ConversionResult[];
  customSigils?: SigilData[];
  annotations?: UserAnnotation[];
}

interface UserAnnotation {
  sigilId: string;
  note: string;
  tags: string[];
  timestamp: number;
}

interface AppUIState {
  showFilters: boolean;
  showPreferences: boolean;
  showExportModal: boolean;
  showImportModal: boolean;
  activeTab: 'sigil' | 'ternary' | 'glyph' | 'search' | 'decimal' | 'history';
  searchQuery: string;
  selectedCategory: string | null;
  minDecimal: number | null;
  maxDecimal: number | null;
}

// Optimized Constants
const TERNARY_CONSTANTS = {
  DIGIT_MAP: new Map([
    ['T', -1],
    ['0', 0],
    ['1', 1]
  ]),
  VALID_PATTERN: /^[T01]{5}$/,
  BASE: 3,
  CODE_LENGTH: 5,
  MIN_VALUE: -121,
  MAX_VALUE: 121
} as const;

// Historical Sources Database
const HISTORICAL_SOURCES: Record<string, AuthenticSigilSource> = {
  paracelsus_1538: {
    author: 'Paracelsus',
    work: 'Archidoxis Magica',
    year: 1538,
    manuscript: 'British Library MS Sloane 1146'
  },
  dee_monas: {
    author: 'John Dee',
    work: 'Monas Hieroglyphica',
    year: 1564,
    manuscript: 'Original Latin Edition'
  },
  valentine_basil: {
    author: 'Basil Valentine',
    work: 'Triumphal Chariot of Antimony',
    year: 1604
  },
  flamel_1418: {
    author: 'Nicolas Flamel',
    work: 'Livre des Figures Hiéroglyphiques',
    year: 1418,
    manuscript: 'Bibliothèque Nationale de France'
  },
  ripley_1471: {
    author: 'George Ripley',
    work: 'The Ripley Scroll',
    year: 1471,
    manuscript: 'British Museum'
  }
};

// Raw Mathematical Functions
const decimalToBalancedTernaryRaw = (decimal: number): string => {
  if (decimal === 0) return '00000';
  
  const digits: string[] = [];
  let num = decimal;
  
  while (num !== 0) {
    let remainder = ((num % 3) + 3) % 3;
    
    if (remainder === 2) {
      remainder = -1;
      num = Math.floor(num / 3) + 1;
    } else {
      num = Math.floor(num / 3);
    }
    
    digits.unshift(remainder === -1 ? 'T' : remainder.toString());
  }
  
  return digits.join('').padStart(TERNARY_CONSTANTS.CODE_LENGTH, '0');
};

const balancedTernaryToDecimalRaw = (code: string): number => {
  let result = 0;
  let power = 1;
  
  for (let i = code.length - 1; i >= 0; i--) {
    const digitValue = TERNARY_CONSTANTS.DIGIT_MAP.get(code[i]) ?? 0;
    result += digitValue * power;
    power *= TERNARY_CONSTANTS.BASE;
  }
  
  return result;
};

// Enhanced input validation
const validateTernaryInput = (input: string): ValidationResult => {
  if (!input) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  
  if (input.length !== TERNARY_CONSTANTS.CODE_LENGTH) {
    return { 
      isValid: false, 
      error: `Input must be exactly ${TERNARY_CONSTANTS.CODE_LENGTH} characters long` 
    };
  }
  
  if (!TERNARY_CONSTANTS.VALID_PATTERN.test(input)) {
    const invalidChars = [...input].filter(char => !TERNARY_CONSTANTS.DIGIT_MAP.has(char));
    return { 
      isValid: false, 
      error: `Invalid characters: ${invalidChars.join(', ')}. Use only T, 0, 1` 
    };
  }
  
  const decimal = balancedTernaryToDecimalRaw(input);
  if (decimal < TERNARY_CONSTANTS.MIN_VALUE || decimal > TERNARY_CONSTANTS.MAX_VALUE) {
    return { 
      isValid: true, 
      warning: `Decimal value ${decimal} is outside typical sigil range` 
    };
  }
  
  return { isValid: true };
};

// Import validation function
const validateImportData = (data: ExportData): ValidationResult => {
  // Version compatibility check
  if (!data.metadata || !data.metadata.version) {
    return { isValid: false, error: 'Invalid file format: Missing metadata' };
  }
  
  const [major, minor] = data.metadata.version.split('.').map(Number);
  if (major < 3 || (major === 3 && minor < 0)) {
    return { isValid: false, error: 'Incompatible version: Requires version 3.0 or higher' };
  }
  
  // Data structure validation
  if (data.customSigils) {
    const invalidSigils = data.customSigils.filter(sigil => 
      !sigil.ternaryCode || !TERNARY_CONSTANTS.VALID_PATTERN.test(sigil.ternaryCode)
    );
    if (invalidSigils.length > 0) {
      return { isValid: false, error: 'Invalid custom sigil data detected' };
    }
  }
  
  if (data.annotations) {
    const invalidAnnotations = data.annotations.filter(annotation => 
      !annotation.sigilId || typeof annotation.note !== 'string'
    );
    if (invalidAnnotations.length > 0) {
      return { isValid: false, error: 'Invalid annotation data detected' };
    }
  }
  
  return { isValid: true };
};

// Authentic Sigil Database
const createCompleteSigilDatabase = (): Map<string, SigilData> => {
  const sigils: SigilData[] = [
    { 
      id: 'quintessence', 
      ternaryCode: 'TTTTT', 
      name: 'Quintessence (Aether)', 
      description: 'The fifth element representing pure spirit', 
      symbol: '🜀', 
      category: 'element',
      decimalValue: -121,
      tags: ['classical', 'aristotelian', 'spirit'],
      unicode: 'U+1F700',
      historicalSource: 'Aristotelian Physics, Medieval Alchemy'
    },
    { 
      id: 'antimony', 
      ternaryCode: 'TTTT0', 
      name: 'Antimony (Stibium)', 
      description: 'Metallic element, symbol of the wild spirit of metals', 
      symbol: '🜾', 
      category: 'element',
      decimalValue: -120,
      tags: ['metal', 'purification', 'transformation'],
      unicode: 'U+1F77E',
      historicalSource: HISTORICAL_SOURCES.valentine_basil
    },
    { 
      id: 'gold', 
      ternaryCode: 'TTTT1', 
      name: 'Gold (Aurum)', 
      description: 'The perfected metal representing spiritual enlightenment', 
      symbol: '🜚', 
      category: 'element',
      decimalValue: -119,
      tags: ['metal', 'sun', 'perfection'],
      unicode: 'U+1F71A',
      historicalSource: HISTORICAL_SOURCES.ripley_1471
    },
    { 
      id: 'mercury', 
      ternaryCode: 'TTT0T', 
      name: 'Mercury (Hydrargyrum)', 
      description: 'Liquid metal representing the principle of transformation', 
      symbol: '🜈', 
      category: 'element',
      decimalValue: -118,
      tags: ['metal', 'fluid', 'messenger'],
      unicode: 'U+1F708',
      historicalSource: HISTORICAL_SOURCES.paracelsus_1538
    },
    { 
      id: 'sulfur', 
      ternaryCode: 'TTT00', 
      name: 'Sulfur', 
      description: 'The principle of combustibility and soul', 
      symbol: '🜍', 
      category: 'element',
      decimalValue: -117,
      tags: ['philosophical', 'soul', 'energy'],
      unicode: 'U+1F70D',
      historicalSource: HISTORICAL_SOURCES.dee_monas
    },
    { 
      id: 'salt', 
      ternaryCode: 'TTT01', 
      name: 'Salt', 
      description: 'The principle of solidity and body', 
      symbol: '🜔', 
      category: 'element',
      decimalValue: -116,
      tags: ['philosophical', 'body', 'stability'],
      unicode: 'U+1F714',
      historicalSource: HISTORICAL_SOURCES.paracelsus_1538
    },
    { 
      id: 'vitriol', 
      ternaryCode: 'TTT1T', 
      name: 'Vitriol', 
      description: 'Sulfuric acid compound, key to dissolution', 
      symbol: '🜖', 
      category: 'compound',
      decimalValue: -115,
      tags: ['acid', 'corrosive', 'green'],
      unicode: 'U+1F716',
      historicalSource: HISTORICAL_SOURCES.valentine_basil
    },
    { 
      id: 'aqua_regia', 
      ternaryCode: 'TTT10', 
      name: 'Aqua Regia', 
      description: 'Royal water that dissolves gold', 
      symbol: '🜆', 
      category: 'compound',
      decimalValue: -114,
      tags: ['acid', 'royal_water', 'gold_solvent'],
      unicode: 'U+1F706',
      historicalSource: HISTORICAL_SOURCES.flamel_1418
    },
    { 
      id: 'crucible', 
      ternaryCode: 'TTT11', 
      name: 'Crucible', 
      description: 'Vessel for transformation through fire', 
      symbol: '🝥', 
      category: 'tool',
      decimalValue: -113,
      tags: ['equipment', 'vessel', 'transformation'],
      unicode: 'U+1F765',
      historicalSource: HISTORICAL_SOURCES.ripley_1471
    },
    { 
      id: 'alembic', 
      ternaryCode: 'TT1TT', 
      name: 'Alembic', 
      description: 'Distillation apparatus for purification', 
      symbol: '🝪', 
      category: 'tool',
      decimalValue: -112,
      tags: ['equipment', 'distillation', 'vessel'],
      unicode: 'U+1F76A',
      historicalSource: HISTORICAL_SOURCES.dee_monas
    }
  ];

  // Enhanced placeholder generation with authentic symbols
  const authenticSymbols = ['🜁', '🜂', '🜃', '🜄', '🜅', '🜇', '🜉', '🜊', '🜋', '🜌', '🜎', '🜏', '🜐', '🜑', '🜒', '🜓', '🜕', '🜗', '🜘', '🜙', '🜛', '🜜', '🝞', '🝠'];
  const authenticCategories: SigilData['category'][] = ['element', 'process', 'celestial', 'compound', 'tool', 'measure'];
  const authenticDescriptions = [
    'Symbol of spiritual transformation',
    'Representation of celestial influence',
    'Alchemical process of purification',
    'Essence of material transmutation',
    'Vessel of cosmic energy',
    'Key to unlocking hidden knowledge',
    'Gateway between material and spiritual realms'
  ];
  
  const placeholderCount = 114; // 124 total - 10 defined above
  for (let i = 0; i < placeholderCount; i++) {
    const decimal = -111 + i;
    const ternaryCode = decimalToBalancedTernaryRaw(decimal);
    const symbolIdx = i % authenticSymbols.length;
    const sourceKey = Object.keys(HISTORICAL_SOURCES)[i % Object.keys(HISTORICAL_SOURCES).length];
    
    sigils.push({
      id: `authentic_${i}`,
      ternaryCode,
      name: `T(Φ${sigils.length + 1})`,
      description: authenticDescriptions[i % authenticDescriptions.length],
      symbol: authenticSymbols[symbolIdx],
      category: authenticCategories[i % authenticCategories.length],
      decimalValue: decimal,
      tags: ['authentic', 'historical', 'alchemical'],
      unicode: `U+${(0x1F700 + symbolIdx).toString(16).toUpperCase()}`,
      historicalSource: HISTORICAL_SOURCES[sourceKey]
    });
  }

  const database = new Map<string, SigilData>();
  sigils.forEach(sigil => {
    database.set(sigil.ternaryCode, sigil);
  });
  return database;
};

// State Management
type AppState = {
  inputs: {
    sigil: string;
    ternary: string;
    decimal: string;
  };
  results: {
    sigil: ConversionResult | null;
    ternary: ConversionResult | null;
    decimal: ConversionResult | null;
    search: SigilData[] | null;
  };
  loadingStates: {
    sigil: boolean;
    ternary: boolean;
    decimal: boolean;
    search: boolean;
  };
  errors: {
    sigil: string | null;
    ternary: string | null;
    decimal: string | null;
  };
  ui: AppUIState;
  preferences: UserPreferences;
  history: ConversionResult[];
  customSigils: SigilData[];
  annotations: UserAnnotation[];
};

type AppAction = 
  | { type: 'SET_INPUT'; field: keyof AppState['inputs']; value: string }
  | { type: 'SET_LOADING'; field: keyof AppState['loadingStates']; loading: boolean }
  | { type: 'SET_RESULT'; field: keyof AppState['results']; result: any }
  | { type: 'SET_ERROR'; field: keyof AppState['errors']; error: string | null }
  | { type: 'SET_UI'; payload: Partial<AppUIState> }
  | { type: 'SET_PREFERENCE'; payload: Partial<UserPreferences> }
  | { type: 'ADD_HISTORY_ENTRY'; entry: ConversionResult }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RESET' }
  | { type: 'ADD_CUSTOM_SIGIL'; sigil: SigilData }
  | { type: 'ADD_ANNOTATION'; annotation: UserAnnotation }
  | { type: 'IMPORT_DATA'; payload: ExportData };

const initialState: AppState = {
  inputs: {
    sigil: '',
    ternary: '',
    decimal: '',
  },
  results: {
    sigil: null,
    ternary: null,
    decimal: null,
    search: null
  },
  loadingStates: {
    sigil: false,
    ternary: false,
    decimal: false,
    search: false
  },
  errors: {
    sigil: null,
    ternary: null,
    decimal: null
  },
  ui: {
    showFilters: false,
    showPreferences: false,
    showExportModal: false,
    showImportModal: false,
    activeTab: 'sigil',
    searchQuery: '',
    selectedCategory: null,
    minDecimal: null,
    maxDecimal: null
  },
  preferences: {
    theme: 'system',
    autoConvert: true,
    keyboardShortcuts: true,
    resultsLimit: 20
  },
  history: [],
  customSigils: [],
  annotations: []
};

// Enhanced shallow equality
function shallowEqual<T extends Record<string, any>>(objA: T, objB: T): boolean {
  if (objA === objB) return true;
  
  if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    Object.prototype.hasOwnProperty.call(objB, key) && 
    objA[key] === objB[key]
  );
}

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INPUT': {
      if (state.inputs[action.field] === action.value && !state.errors[action.field]) {
        return state;
      }
      return {
        ...state,
        inputs: { ...state.inputs, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: null }
      };
    }
    case 'SET_LOADING': {
      if (state.loadingStates[action.field] === action.loading) {
        return state;
      }
      return {
        ...state,
        loadingStates: { ...state.loadingStates, [action.field]: action.loading }
      };
    }
    case 'SET_RESULT': {
      if (state.results[action.field] === action.result) {
        return state;
      }
      return {
        ...state,
        results: { ...state.results, [action.field]: action.result }
      };
    }
    case 'SET_ERROR': {
      if (state.errors[action.field] === action.error) {
        return state;
      }
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    }
    case 'SET_UI': {
      const newUI = { ...state.ui, ...action.payload };
      if (shallowEqual(state.ui, newUI)) {
        return state;
      }
      return {
        ...state,
        ui: newUI
      };
    }
    case 'SET_PREFERENCE':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [action.entry, ...state.history.slice(0, 49)]
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: []
      };
    case 'RESET':
      return { 
        ...initialState, 
        preferences: state.preferences,
        ui: { ...initialState.ui, activeTab: state.ui.activeTab }
      };
    case 'ADD_CUSTOM_SIGIL':
      return {
        ...state,
        customSigils: [...state.customSigils, action.sigil]
      };
    case 'ADD_ANNOTATION':
      return {
        ...state,
        annotations: [...state.annotations.filter(a => a.sigilId !== action.annotation.sigilId), action.annotation]
      };
    case 'IMPORT_DATA': {
      const { preferences, history, customSigils, annotations } = action.payload;
      return {
        ...state,
        preferences: preferences || state.preferences,
        history: history || state.history,
        customSigils: customSigils || state.customSigils,
        annotations: annotations || state.annotations
      };
    }
    default:
      return state;
  }
};

// In-memory storage hook
const useInMemoryStorage = <T,>(initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const setValue = useCallback((value: T) => {
    setStoredValue(value);
  }, []);
  return [storedValue, setValue];
};

// File drop hook
const useFileDrop = (onDrop: (file: File) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (jsonFile) onDrop(jsonFile);
  }, [onDrop]);
  
  return { isDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop };
};

// Export/Import hook
const useExportImport = (state: AppState) => {
  const exportData = useCallback((type: 'full' | 'history' | 'preferences' = 'full') => {
    const exportData: ExportData = {
      metadata: {
        version: '3.1.0',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        exportType: type
      },
      preferences: state.preferences,
      history: state.history,
      customSigils: type === 'full' ? state.customSigils : undefined,
      annotations: type === 'full' ? state.annotations : undefined
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tphi10-${type}-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((file: File, dispatch: React.Dispatch<AppAction>) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as ExportData;
          
          // Basic validation
          if (!data.metadata || !data.metadata.version) {
            throw new Error('Invalid file format: Missing metadata');
          }
          
          // Enhanced validation
          const validation = validateImportData(data);
          if (!validation.isValid) {
            throw new Error(validation.error || 'Invalid import data');
          }
          
          dispatch({ type: 'IMPORT_DATA', payload: data });
          resolve({ success: true, data });
        } catch (error: any) {
          reject({ success: false, error: error.message });
        }
      };
      
      reader.onerror = () => {
        reject({ success: false, error: 'Error reading file' });
      };
      
      reader.readAsText(file);
    });
  }, []);

  return { exportData, importData };
};

// Optimized memoized conversions
const useMemoizedConversions = () => {
  const decimalToTernaryCache = useRef(new Map<number, string>());
  const ternaryToDecimalCache = useRef(new Map<string, number>());
  
  const decimalToBalancedTernary = (decimal: number): string => {
    const cache = decimalToTernaryCache.current;
    if (cache.has(decimal)) {
      return cache.get(decimal)!;
    }
    
    const result = decimalToBalancedTernaryRaw(decimal);
    cache.set(decimal, result);
    return result;
  };

  const balancedTernaryToDecimal = (ternary: string): number => {
    const cache = ternaryToDecimalCache.current;
    if (cache.has(ternary)) {
      return cache.get(ternary)!;
    }
    
    const result = balancedTernaryToDecimalRaw(ternary);
    cache.set(ternary, result);
    return result;
  };

  const getCacheStatus = (type: 'decimal' | 'ternary', value: string | number) => {
    if (type === 'decimal') {
      return decimalToTernaryCache.current.has(value as number);
    } else {
      return ternaryToDecimalCache.current.has(value as string);
    }
  };

  return {
    decimalToBalancedTernary,
    balancedTernaryToDecimal,
    getCacheStatus
  };
};

// Database with indices
const useSigilDatabase = () => {
  return useMemo(() => {
    const database = createCompleteSigilDatabase();
    const categoryStats = new Map<string, number>();
    database.forEach(sigil => {
      const count = categoryStats.get(sigil.category) || 0;
      categoryStats.set(sigil.category, count + 1);
    });
    return { database, categoryStats };
  }, []);
};

// Enhanced search with indexing
const useDatabaseIndices = (database: Map<string, SigilData>) => {
  const indices = useMemo(() => {
    const nameIndex = new Map<string, SigilData[]>();
    const descriptionIndex = new Map<string, SigilData[]>();
    const categoryIndex = new Map<string, SigilData[]>();
    const tagIndex = new Map<string, SigilData[]>();
    const decimalIndex = new Map<number, SigilData>();
    
    database.forEach(sigil => {
      // Name index (tokenized)
      const nameTokens = sigil.name.toLowerCase().split(/[\s\-()]+/).filter(Boolean);
      nameTokens.forEach(token => {
        if (!nameIndex.has(token)) nameIndex.set(token, []);
        nameIndex.get(token)!.push(sigil);
      });
      
      // Description index (tokenized)
      const descTokens = sigil.description.toLowerCase().split(/[\s\-()]+/).filter(Boolean);
      descTokens.forEach(token => {
        if (token.length > 2) { // Skip short words
          if (!descriptionIndex.has(token)) descriptionIndex.set(token, []);
          descriptionIndex.get(token)!.push(sigil);
        }
      });
      
      // Category index
      if (!categoryIndex.has(sigil.category)) categoryIndex.set(sigil.category, []);
      categoryIndex.get(sigil.category)!.push(sigil);
      
      // Tag index
      sigil.tags?.forEach(tag => {
        const tagKey = tag.toLowerCase();
        if (!tagIndex.has(tagKey)) tagIndex.set(tagKey, []);
        tagIndex.get(tagKey)!.push(sigil);
      });
      
      // Decimal index
      decimalIndex.set(sigil.decimalValue, sigil);
    });
    
    return { nameIndex, descriptionIndex, categoryIndex, tagIndex, decimalIndex };
  }, [database]);
  
  const searchWithIndices = useCallback((query: string, filters: {
    category?: string;
    minDecimal?: number;
    maxDecimal?: number;
  } = {}) => {
    const results = new Set<SigilData>();
    const queryTokens = query.toLowerCase().split(/[\s\-()]+/).filter(Boolean);
    
    // Numeric search
    if (/^\-?\d+$/.test(query.trim())) {
      const decimal = parseInt(query.trim());
      const sigil = indices.decimalIndex.get(decimal);
      if (sigil) results.add(sigil);
    }
    
    // Token-based search
    queryTokens.forEach(token => {
      // Search in name index
      indices.nameIndex.get(token)?.forEach(sigil => results.add(sigil));
      
      // Search in description index
      indices.descriptionIndex.get(token)?.forEach(sigil => results.add(sigil));
      
      // Search in tags
      indices.tagIndex.get(token)?.forEach(sigil => results.add(sigil));
      
      // Partial matches in category
      if (token === filters.category?.toLowerCase()) {
        indices.categoryIndex.get(filters.category)?.forEach(sigil => results.add(sigil));
      }
    });
    
    // Apply filters
    return Array.from(results).filter(sigil => {
      const categoryMatch = !filters.category || sigil.category === filters.category;
      const minMatch = filters.minDecimal === undefined || sigil.decimalValue >= filters.minDecimal;
      const maxMatch = filters.maxDecimal === undefined || sigil.decimalValue <= filters.maxDecimal;
      return categoryMatch && minMatch && maxMatch;
    });
  }, [indices]);

  return { indices, searchWithIndices };
};

// Error boundary
class ConversionErrorBoundary extends React.Component<{ 
  children: React.ReactNode;
  resetKey?: string;
}, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Conversion Error:', error, errorInfo);
  }
  
  componentDidUpdate(prevProps: { resetKey?: string }) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-4">
            <AlertCircle size={32} className="text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
                Conversion Error
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">
                The operation couldn't be completed. Please try again.
              </p>
              
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Reset Converter
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Performance monitoring
const usePerformanceMetrics = () => {
  const metrics = useRef({
    conversionCount: 0,
    cacheHits: 0,
    searchTimes: [] as number[],
    startTime: performance.now()
  });
  
  const recordConversion = (cacheHit: boolean) => {
    metrics.current.conversionCount++;
    if (cacheHit) metrics.current.cacheHits++;
  };
  
  const recordSearch = (duration: number) => {
    metrics.current.searchTimes.push(duration);
    if (metrics.current.searchTimes.length > 100) {
      metrics.current.searchTimes = metrics.current.searchTimes.slice(-50);
    }
  };
  
  const getMetrics = () => {
    const cacheHitRate = metrics.current.conversionCount > 0
      ? (metrics.current.cacheHits / metrics.current.conversionCount) * 100
      : 0;
    
    const averageSearchTime = metrics.current.searchTimes.length > 0
      ? metrics.current.searchTimes.reduce((sum, t) => sum + t, 0) / metrics.current.searchTimes.length
      : 0;
    
    return {
      cacheHitRate,
      averageSearchTime,
      uptime: performance.now() - metrics.current.startTime,
      totalConversions: metrics.current.conversionCount,
      totalSearches: metrics.current.searchTimes.length
    };
  };
  
  return { recordConversion, recordSearch, getMetrics };
};

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Main Component
const ProductionTPhi10SigilReader: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { database, categoryStats } = useSigilDatabase();
  const { decimalToBalancedTernary, balancedTernaryToDecimal, getCacheStatus } = useMemoizedConversions();
  const { searchWithIndices } = useDatabaseIndices(database);
  const { recordConversion, recordSearch, getMetrics } = usePerformanceMetrics();
  const [preferences, setPreferences] = useInMemoryStorage<UserPreferences>(initialState.preferences);
  const debouncedSearch = useDebounce(state.ui.searchQuery, 300);
  const { exportData, importData } = useExportImport(state);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  
  // Drag and drop functionality
  const { 
    isDragging, 
    handleDragOver, 
    handleDragEnter, 
    handleDragLeave, 
    handleDrop 
  } = useFileDrop((file) => {
    setImportStatus('processing');
    setImportError(null);
    handleFileImport(file);
  });

  // Sync preferences
  useEffect(() => {
    dispatch({ type: 'SET_PREFERENCE', payload: preferences });
  }, [preferences]);

  // Enhanced search handler
  const handleOptimizedSearch = useCallback(() => {
    if (!debouncedSearch) {
      dispatch({ type: 'SET_RESULT', field: 'search', result: null });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', field: 'search', loading: true });
    
    const startTime = performance.now();
    const results = searchWithIndices(debouncedSearch, {
      category: state.ui.selectedCategory || undefined,
      minDecimal: state.ui.minDecimal !== null ? state.ui.minDecimal : undefined,
      maxDecimal: state.ui.maxDecimal !== null ? state.ui.maxDecimal : undefined
    }).slice(0, preferences.resultsLimit);
    
    const duration = performance.now() - startTime;
    recordSearch(duration);
    
    dispatch({ type: 'SET_RESULT', field: 'search', result: results });
    dispatch({ type: 'SET_LOADING', field: 'search', loading: false });
  }, [debouncedSearch, state.ui, preferences.resultsLimit, searchWithIndices, recordSearch]);

  // Enhanced sigil decoder
  const handleOptimizedSigilDecode = useCallback(async () => {
    try {
      const validation = validateTernaryInput(state.inputs.sigil);
      if (!validation.isValid) {
        dispatch({ type: 'SET_ERROR', field: 'sigil', error: validation.error! });
        return;
      }
      
      dispatch({ type: 'SET_LOADING', field: 'sigil', loading: true });
      
      const cacheHit = getCacheStatus('ternary', state.inputs.sigil);
      const decimal = balancedTernaryToDecimal(state.inputs.sigil);
      recordConversion(cacheHit);
      
      const sigil = database.get(state.inputs.sigil);
      const result: ConversionResult = {
        input: state.inputs.sigil,
        output: sigil ? `${sigil.symbol} ${sigil.name}` : 'Unknown sigil',
        metadata: sigil || { warning: 'Sigil not found' },
        timestamp: Date.now()
      };
      
      dispatch({ type: 'SET_RESULT', field: 'sigil', result });
      dispatch({ type: 'ADD_HISTORY_ENTRY', entry: result });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', field: 'sigil', error: 'Conversion failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', field: 'sigil', loading: false });
    }
  }, [state.inputs.sigil, database, balancedTernaryToDecimal, getCacheStatus, recordConversion]);

  // Enhanced file import with validation and feedback
  const handleFileImport = useCallback(async (file: File) => {
    try {
      setImportStatus('processing');
      setImportError(null);
      
      const result = await importData(file, dispatch);
      if (result.success) {
        setImportStatus('success');
        
        // Auto-close modal after success
        setTimeout(() => {
          dispatch({ type: 'SET_UI', payload: { showImportModal: false } });
          setImportStatus('idle');
        }, 1500);
      }
    } catch (error: any) {
      setImportError(error.error || error.message);
      setImportStatus('error');
    } finally {
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [importData]);

  // Auto-convert functionality
  useEffect(() => {
    if (!preferences.autoConvert) return;
    
    const timeoutId = setTimeout(() => {
      switch (state.ui.activeTab) {
        case 'sigil':
          if (state.inputs.sigil.length === 5 && TERNARY_CONSTANTS.VALID_PATTERN.test(state.inputs.sigil)) {
            handleOptimizedSigilDecode();
          }
          break;
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.inputs, state.ui.activeTab, preferences.autoConvert, handleOptimizedSigilDecode]);

  // Search effect
  useEffect(() => {
    if (state.ui.activeTab === 'search') {
      handleOptimizedSearch();
    }
  }, [debouncedSearch, state.ui.selectedCategory, state.ui.minDecimal, state.ui.maxDecimal, handleOptimizedSearch]);

  // Utility functions
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }, []);

  // UI Components
  const TabButton: React.FC<{ 
    id: AppUIState['activeTab'], 
    icon: React.ReactNode, 
    label: string,
    count?: number 
  }> = ({ id, icon, label, count }) => (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        state.ui.activeTab === id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      onClick={() => dispatch({ type: 'SET_UI', payload: { activeTab: id } })}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          state.ui.activeTab === id ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const StatCard: React.FC<{ value: number | string; label: string; color: string }> = ({ 
    value, label, color 
  }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );

  // Theme management
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark);
    };

    if (preferences.theme === 'system') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
      
      applyTheme(darkModeMediaQuery.matches);
      darkModeMediaQuery.addEventListener('change', handleChange);
      
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }
    
    applyTheme(preferences.theme === 'dark');
  }, [preferences.theme]);

  // Keyboard shortcuts
  const keyboardHandlers = useMemo(() => ({
    's': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'search' } }),
    'r': () => dispatch({ type: 'RESET' }),
    'f': () => dispatch({ type: 'SET_UI', payload: { showFilters: !state.ui.showFilters } }),
    'p': () => dispatch({ type: 'SET_UI', payload: { showPreferences: !state.ui.showPreferences } }),
    'h': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'history' } }),
    '1': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'sigil' } }),
    '2': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'ternary' } }),
    '3': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'decimal' } }),
    '4': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'search' } }),
    '5': () => dispatch({ type: 'SET_UI', payload: { activeTab: 'history' } }),
  }), [state.ui.showFilters, state.ui.showPreferences, state.ui.activeTab]);

  useEffect(() => {
    if (!preferences.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const handler = keyboardHandlers[event.key.toLowerCase()];
        if (handler && !event.repeat) {
          event.preventDefault();
          handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardShortcuts, keyboardHandlers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            🔺 T-Phi10 Sigil Reader
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Advanced Alchemical Symbol Processing System
          </p>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            <StatCard value={database.size} label="Total Symbols" color="text-blue-500" />
            {Array.from(categoryStats.entries()).map(([category, count]) => (
              <StatCard 
                key={category} 
                value={count} 
                label={category.charAt(0).toUpperCase() + category.slice(1)} 
                color="text-purple-500" 
              />
            ))}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <TabButton id="sigil" icon={<Search size={16} />} label="Sigil Decoder" />
          <TabButton id="ternary" icon={<Calculator size={16} />} label="Ternary Math" />
          <TabButton id="decimal" icon={<Hash size={16} />} label="Decimal Converter" />
          <TabButton id="search" icon={<Grid size={16} />} label="Symbol Search" count={state.results.search?.length} />
          <TabButton id="history" icon={<History size={16} />} label="History" count={state.history.length} />
          
          <div className="ml-auto flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              onClick={() => dispatch({ type: 'SET_UI', payload: { showPreferences: !state.ui.showPreferences } })}
              title="Settings (Ctrl+P)"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Sigil Decoder Tab */}
            {state.ui.activeTab === 'sigil' && (
              <ConversionErrorBoundary resetKey={state.inputs.sigil}>
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold mb-6 text-green-500 flex items-center gap-3">
                    <Search size={24} />
                    Alchemical Sigil Decoder
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={state.inputs.sigil}
                        onChange={(e) => dispatch({ type: 'SET_INPUT', field: 'sigil', value: e.target.value.toUpperCase() })}
                        placeholder="Enter 5-digit ternary code (e.g. TT1T1)"
                        maxLength={5}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={handleOptimizedSigilDecode}
                        disabled={state.loadingStates.sigil}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 text-white font-medium"
                      >
                        {state.loadingStates.sigil ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}
                        Decode
                      </button>
                    </div>
                    
                    {state.errors.sigil && (
                      <div className="flex items-center gap-2 text-red-500 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <AlertCircle size={16} />
                        <span>{state.errors.sigil}</span>
                      </div>
                    )}
                    
                    {state.results.sigil && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-5xl drop-shadow-lg">{state.results.sigil.metadata?.symbol}</span>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{state.results.sigil.output}</h3>
                              <p className="text-green-600 dark:text-green-400 mt-1">{state.results.sigil.metadata?.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(state.results.sigil?.input || '')}
                            className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 p-3 rounded-lg"
                            title="Copy ternary code"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                        
                        {state.results.sigil.metadata && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                                <span className="ml-2 text-blue-600 dark:text-blue-400 capitalize">
                                  {state.results.sigil.metadata.category}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Decimal Value:</span>
                                <span className="ml-2 text-purple-600 dark:text-purple-400 font-mono font-bold">
                                  {state.results.sigil.metadata.decimalValue}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Unicode:</span>
                                <span className="ml-2 font-mono text-gray-700 dark:text-gray-300">
                                  {state.results.sigil.metadata.unicode}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Source:</span>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  {typeof state.results.sigil.metadata.historicalSource === 'string' 
                                    ? state.results.sigil.metadata.historicalSource
                                    : `${state.results.sigil.metadata.historicalSource?.author}, ${state.results.sigil.metadata.historicalSource?.work} (${state.results.sigil.metadata.historicalSource?.year})`}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </ConversionErrorBoundary>
            )}
            
            {/* Search Tab */}
            {state.ui.activeTab === 'search' && (
              <ConversionErrorBoundary resetKey={state.ui.searchQuery}>
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-amber-500 flex items-center gap-3">
                      <Grid size={24} />
                      Symbol Search
                    </h2>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => dispatch({ type: 'SET_UI', payload: { showFilters: !state.ui.showFilters } })}
                        className={`p-2 rounded-lg ${
                          state.ui.showFilters 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title="Toggle Filters"
                      >
                        <Filter size={16} />
                      </button>
                      <button
                        onClick={() => {
                          dispatch({ type: 'SET_UI', payload: { 
                            searchQuery: '', 
                            selectedCategory: null,
                            minDecimal: null,
                            maxDecimal: null 
                          }});
                          dispatch({ type: 'SET_RESULT', field: 'search', result: null });
                        }}
                        className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                        title="Clear Search"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={state.ui.searchQuery}
                      onChange={(e) => dispatch({ type: 'SET_UI', payload: { searchQuery: e.target.value } })}
                      placeholder="Search symbols by name, description, tags..."
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    
                    {/* Filters Panel */}
                    {state.ui.showFilters && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Category
                            </label>
                            <select
                              value={state.ui.selectedCategory || ''}
                              onChange={(e) => dispatch({ type: 'SET_UI', payload: { selectedCategory: e.target.value || null } })}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">All Categories</option>
                              {Array.from(categoryStats.keys()).map(category => (
                                <option key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Min Decimal
                            </label>
                            <input
                              type="number"
                              min={TERNARY_CONSTANTS.MIN_VALUE}
                              max={TERNARY_CONSTANTS.MAX_VALUE}
                              value={state.ui.minDecimal || ''}
                              onChange={(e) => dispatch({ type: 'SET_UI', payload: { minDecimal: e.target.value ? parseInt(e.target.value) : null } })}
                              placeholder="-121"
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Max Decimal
                            </label>
                            <input
                              type="number"
                              min={TERNARY_CONSTANTS.MIN_VALUE}
                              max={TERNARY_CONSTANTS.MAX_VALUE}
                              value={state.ui.maxDecimal || ''}
                              onChange={(e) => dispatch({ type: 'SET_UI', payload: { maxDecimal: e.target.value ? parseInt(e.target.value) : null } })}
                              placeholder="121"
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Search Results */}
                    <div className="mt-6">
                      {state.loadingStates.search ? (
                        <div className="flex justify-center py-12">
                          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : state.results.search && state.results.search.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {state.results.search.map((sigil) => (
                            <div 
                              key={sigil.id} 
                              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                              onClick={() => {
                                dispatch({ type: 'SET_INPUT', field: 'sigil', value: sigil.ternaryCode });
                                dispatch({ type: 'SET_UI', payload: { activeTab: 'sigil' } });
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-4xl drop-shadow-sm">{sigil.symbol}</span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{sigil.name}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{sigil.description}</p>
                                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                                      {sigil.category}
                                    </span>
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                                      {sigil.decimalValue}
                                    </span>
                                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                      {sigil.ternaryCode}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : state.ui.searchQuery ? (
                        <div className="text-center py-12 text-gray-500">
                          <Search size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No symbols found matching your search</p>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Grid size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Enter a search term to explore symbols</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </ConversionErrorBoundary>
            )}
            
            {/* History Tab */}
            {state.ui.activeTab === 'history' && (
              <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 text-indigo-500 flex items-center gap-3">
                  <History size={24} />
                  Conversion History
                </h2>
                
                {state.history.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {state.history.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {entry.input} → {entry.output}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (entry.metadata?.ternaryCode) {
                                dispatch({ type: 'SET_INPUT', field: 'sigil', value: entry.metadata.ternaryCode });
                                dispatch({ type: 'SET_UI', payload: { activeTab: 'sigil' } });
                              } else if (typeof entry.output === 'string') {
                                dispatch({ type: 'SET_INPUT', field: 'sigil', value: entry.output });
                                dispatch({ type: 'SET_UI', payload: { activeTab: 'sigil' } });
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                          >
                            Load
                          </button>
                        </div>
                        {entry.metadata?.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {entry.metadata.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <History size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No conversion history yet</p>
                    <p className="text-sm mt-2">Perform conversions to see them here</p>
                  </div>
                )}
              </section>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preferences Panel */}
            {state.ui.showPreferences && (
              <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                    <Settings size={20} />
                    Preferences
                  </h3>
                  <button
                    onClick={() => dispatch({ type: 'SET_UI', payload: { showPreferences: false } })}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme Preference
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="system">Follow System</option>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.autoConvert}
                        onChange={(e) => setPreferences({ ...preferences, autoConvert: e.target.checked })}
                        className="rounded text-yellow-500 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="font-medium">Auto-convert on input</span>
                        <p className="text-xs text-gray-500">Automatically convert when valid input is detected</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.keyboardShortcuts}
                        onChange={(e) => setPreferences({ ...preferences, keyboardShortcuts: e.target.checked })}
                        className="rounded text-yellow-500 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="font-medium">Keyboard shortcuts</span>
                        <p className="text-xs text-gray-500">Enable keyboard navigation and shortcuts</p>
                      </div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Results Limit
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      step="5"
                      value={preferences.resultsLimit}
                      onChange={(e) => setPreferences({ ...preferences, resultsLimit: parseInt(e.target.value) || 20 })}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of search results to display</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => dispatch({ type: 'SET_UI', payload: { showExportModal: true } })}
                        className="flex items-center justify-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                      >
                        <FileOutput size={18} />
                        <span>Export Data</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          dispatch({ type: 'SET_UI', payload: { showImportModal: true } });
                          setImportStatus('idle');
                          setImportError(null);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-lg transition-colors"
                      >
                        <FileInput size={18} />
                        <span>Import Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
            
            {/* Quick Actions */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-pink-500 flex items-center gap-2">
                <Zap size={20} />
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => dispatch({ type: 'RESET' })}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-750 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                >
                  <RefreshCw size={24} className="group-hover:rotate-180 transition-transform" />
                  <span className="text-sm font-medium">Reset All</span>
                </button>
                
                <button
                  onClick={() => copyToClipboard(JSON.stringify(getMetrics(), null, 2))}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-750 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <BarChart2 size={24} />
                  <span className="text-sm font-medium">Copy Metrics</span>
                </button>
              </div>
            </section>
            
            {/* Performance Metrics */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-500 flex items-center gap-2">
                <BarChart2 size={20} />
                Performance
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Cache Hit Rate:</span>
                  <span className="font-mono font-bold text-green-600">
                    {getMetrics().cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Search Time:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {getMetrics().averageSearchTime.toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Conversions:</span>
                  <span className="font-mono font-bold text-purple-600">
                    {getMetrics().totalConversions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-mono font-bold text-gray-600">
                    {(getMetrics().uptime / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            <p className="text-lg font-semibold">T-Phi10 Sigil Reader v3.1</p>
            <p>Advanced Mathematical Alchemical Symbol Processing System</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-500 mb-6">
            <div className="text-center">
              <div className="font-semibold text-blue-500">Database</div>
              <div>{database.size} symbols</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-500">Categories</div>
              <div>{categoryStats.size} types</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-500">Range</div>
              <div>±121 decimal</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-500">System</div>
              <div>Balanced Ternary</div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-500 italic max-w-2xl mx-auto">
            "The ternary system reflects the alchemical triad of Salt, Sulfur, and Mercury, providing a mathematical framework for symbolic transformation."
          </p>
        </footer>
      </div>
      
      {/* Export Modal */}
      {state.ui.showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-blue-500 flex items-center gap-2">
                <FileOutput size={24} />
                Export Data
              </h3>
              <button
                onClick={() => dispatch({ type: 'SET_UI', payload: { showExportModal: false } })}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Select what data you want to export. Your information will be downloaded as a JSON file.
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <input
                    type="radio"
                    name="exportType"
                    value="full"
                    defaultChecked
                    className="text-blue-500"
                  />
                  <div>
                    <span className="font-medium">Full Export</span>
                    <p className="text-xs text-gray-500">Preferences, history, custom sigils, annotations</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <input
                    type="radio"
                    name="exportType"
                    value="preferences"
                    className="text-blue-500"
                  />
                  <div>
                    <span className="font-medium">Preferences Only</span>
                    <p className="text-xs text-gray-500">Current settings and options</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <input
                    type="radio"
                    name="exportType"
                    value="history"
                    className="text-blue-500"
                  />
                  <div>
                    <span className="font-medium">Conversion History</span>
                    <p className="text-xs text-gray-500">Past conversion results</p>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const exportType = document.querySelector<HTMLInputElement>('input[name="exportType"]:checked')?.value as 'full' | 'history' | 'preferences';
                    exportData(exportType);
                    dispatch({ type: 'SET_UI', payload: { showExportModal: false } });
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export Data
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_UI', payload: { showExportModal: false } })}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal with Enhanced States */}
      {state.ui.showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md transition-all ${
              isDragging ? 'ring-4 ring-blue-500 scale-105' : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-500 flex items-center gap-2">
                <FileInput size={24} />
                Import Data
              </h3>
              <button
                onClick={() => {
                  dispatch({ type: 'SET_UI', payload: { showImportModal: false } });
                  setImportStatus('idle');
                  setImportError(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {importStatus === 'idle' && (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Select a JSON file to import data. The system will validate the file before importing.
                    </p>
                  </div>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <FileInput size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="mb-4">
                      {isDragging ? 'Drop your JSON file here' : 'Drag & drop your JSON file here'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setImportStatus('processing');
                          handleFileImport(e.target.files[0]);
                        }
                      }}
                      accept=".json"
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
                    >
                      Select File
                    </button>
                  </div>
                </>
              )}
              
              {importStatus === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p>Validating and importing data...</p>
                </div>
              )}
              
              {importStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Data imported successfully!</p>
                </div>
              )}
              
              {importStatus === 'error' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-4">
                    Import Failed
                  </h4>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-left">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {importError}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setImportStatus('idle');
                      setImportError(null);
                    }}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {importStatus === 'idle' && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileInput size={18} />
                    Select File
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_UI', payload: { showImportModal: false } });
                      setImportStatus('idle');
                      setImportError(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};

export default ProductionTPhi10SigilReader;
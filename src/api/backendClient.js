const isBrowser = typeof window !== "undefined";

const storage = {
  get(key, fallback) {
    if (!isBrowser) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (!isBrowser) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

const makeId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

const matchesFilter = (item, filter = {}) => {
  if (!filter || typeof filter !== 'object') return true;
  return Object.entries(filter).every(([key, value]) => item?.[key] === value);
};

const sortByMaybe = (items, sort) => {
  if (!sort || typeof sort !== 'string') return items;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    if (a?.[key] === b?.[key]) return 0;
    return (a?.[key] > b?.[key] ? 1 : -1) * (desc ? -1 : 1);
  });
};

function createEntityStore(name) {
  const key = `leftosense_entity_${name}`;
  return {
    async list(sort) {
      return sortByMaybe(storage.get(key, []), sort);
    },
    async filter(filter = {}) {
      return storage.get(key, []).filter((item) => matchesFilter(item, filter));
    },
    async get(id) {
      return storage.get(key, []).find((item) => item.id === id) ?? null;
    },
    async create(data) {
      const items = storage.get(key, []);
      const record = { id: data?.id || makeId(name.toLowerCase()), created_date: new Date().toISOString(), ...clone(data) };
      items.unshift(record);
      storage.set(key, items);
      return record;
    },
    async update(id, patch) {
      const items = storage.get(key, []);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`${name} not found`);
      items[index] = { ...items[index], ...clone(patch), updated_date: new Date().toISOString() };
      storage.set(key, items);
      return items[index];
    }
  };
}

const uploadFile = async ({ file }) => ({
  file_url: isBrowser && file ? URL.createObjectURL(file) : ''
});

const invokeLLM = async ({ prompt }) => {
  return {
    foodkeeper_match: 'Cooked Leftovers',
    confidence_percentage: 82,
    storage_recommendation: 'Refrigerate promptly in an airtight container.',
    safe_duration_hours: 72,
    safety_tips: 'Use within 3 to 4 days and discard if odor, texture, or color changes noticeably.',
    storage_temp: '40°F / 4°C or below',
    spoilage_signs: ['Off odor', 'Visible mold', 'Slimy texture'],
    generated_text: `Mock response for local development. Prompt preview: ${String(prompt || '').slice(0, 120)}`
  };
};

const sendEmail = async () => ({ success: true, message: 'Email integration is not configured in this local demo.' });

const inferProduce = (imageUrl = '') => {
  const lower = String(imageUrl).toLowerCase();
  const options = ['apple', 'banana', 'orange', 'tomato', 'strawberry', 'mango', 'avocado', 'lemon', 'cucumber', 'bell pepper'];
  return options.find((item) => lower.includes(item.replace(' ', ''))) || 'apple';
};

const mockAnalysis = (produce = 'apple') => ({
  detected_produce: produce,
  freshness_class: 'fresh',
  defect_labels_json: JSON.stringify(['none']),
  explanation_text: `This demo build detected ${produce} and estimated that it appears visually fresh based on color and surface consistency.`,
  final_recommendation: 'Looks good based on visible surface cues. Continue normal food-safety practices.',
  limitations: 'This local demo only evaluates visible appearance and does not detect internal spoilage or pathogens.',
  model_version: 'demo-local-v1',
  visual_regions_analyzed: ['surface color', 'blemishes', 'texture'],
  defect_severity_score: 12,
  model_confidence: 0.88,
  safe_to_consume_visual_estimate: 'likely_ok',
  heatmap_url: null
});

const functions = {
  async invoke(name, payload = {}) {
    switch (name) {
      case 'detectProduce': {
        const detectedProduce = inferProduce(payload.image_url);
        return { data: {
          status: 'success',
          detected_produce: detectedProduce,
          detection_confidence: 0.91,
          analysis_supported: true,
          message: `${detectedProduce} detected successfully.`
        }};
      }
      case 'analyzeQuality':
        return { data: mockAnalysis(payload.detected_produce || inferProduce(payload.image_url)) };
      case 'getModelRegistry':
        return { data: [
          { id: 'model_local_1', name: 'Visual Freshness CNN', validation_f1: 0.91, version: 'demo-local-v1' }
        ] };
      case 'getDatasetCoverage':
        return { data: {
          classes_supported: 10,
          total_images: 0,
          note: 'Dataset statistics are not bundled with this public repository snapshot.'
        } };
      default:
        return { data: {} };
    }
  }
};

export const backendClient = {
  auth: {
    async me() {
      const session = storage.get('leftosense_session', null);
      if (!session) throw new Error('Not authenticated');
      return {
        id: session.userId || 'local-user',
        username: session.username || 'demo_user',
        role: session.role || 'user'
      };
    },
    logout(redirectUrl) {
      if (isBrowser) {
        window.localStorage.removeItem('leftosense_session');
        if (redirectUrl) window.location.href = '/';
      }
    },
    redirectToLogin() {
      if (isBrowser) window.location.href = '/LoginAuth';
    }
  },
  entities: {
    AppUser: createEntityStore('AppUser'),
    Food: createEntityStore('Food'),
    ScanHistory: createEntityStore('ScanHistory'),
    ProduceModelRegistry: createEntityStore('ProduceModelRegistry'),
    TrainingDatasetStats: createEntityStore('TrainingDatasetStats')
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
      InvokeLLM: invokeLLM,
      SendEmail: sendEmail
    }
  },
  functions,
  appLogs: {
    async logUserInApp() {
      return { ok: true };
    }
  }
};

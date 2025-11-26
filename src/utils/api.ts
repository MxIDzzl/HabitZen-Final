import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-ba03ada2`;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string;
}

async function apiRequest(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ==================== AUTH API ====================

export const authAPI = {
  signup: async (email: string, password: string, username: string) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: { email, password, username },
    });
  },

  getMe: async (token: string) => {
    return apiRequest('/auth/me', { token });
  },
};

// ==================== HABITS API ====================

export const habitsAPI = {
  getAll: async (token: string) => {
    return apiRequest('/habits', { token });
  },

  create: async (token: string, title: string, description: string, category: string) => {
    return apiRequest('/habits', {
      method: 'POST',
      token,
      body: { title, description, category },
    });
  },

  update: async (token: string, id: string, title: string, description: string, category: string) => {
    return apiRequest(`/habits/${id}`, {
      method: 'PUT',
      token,
      body: { title, description, category },
    });
  },

  delete: async (token: string, id: string) => {
    return apiRequest(`/habits/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

// ==================== COMPLETIONS API ====================

export const completionsAPI = {
  getAll: async (token: string, startDate?: string, endDate?: string) => {
    let endpoint = '/completions';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return apiRequest(endpoint, { token });
  },

  complete: async (token: string, habitId: string, completionDate: string) => {
    return apiRequest('/completions', {
      method: 'POST',
      token,
      body: { habit_id: habitId, completion_date: completionDate },
    });
  },

  uncomplete: async (token: string, habitId: string, date: string) => {
    return apiRequest(`/completions/${habitId}/${date}`, {
      method: 'DELETE',
      token,
    });
  },
};

// ==================== FRIENDS API ====================

export const friendsAPI = {
  getAll: async (token: string) => {
    return apiRequest('/friends', { token });
  },

  sendRequest: async (token: string, toUserId: string) => {
    return apiRequest('/friends/request', {
      method: 'POST',
      token,
      body: { to_user_id: toUserId },
    });
  },

  getRequests: async (token: string) => {
    return apiRequest('/friends/requests', { token });
  },

  acceptRequest: async (token: string, requestId: string) => {
    return apiRequest(`/friends/accept/${requestId}`, {
      method: 'POST',
      token,
    });
  },
};

// ==================== COMMUNITY API ====================

export const communityAPI = {
  getPosts: async (token: string) => {
    return apiRequest('/community/posts', { token });
  },

  createPost: async (token: string, habitId: string, streak: number) => {
    return apiRequest('/community/posts', {
      method: 'POST',
      token,
      body: { habit_id: habitId, streak },
    });
  },

  likePost: async (token: string, postId: string) => {
    return apiRequest(`/community/posts/${postId}/like`, {
      method: 'POST',
      token,
    });
  },

  commentPost: async (token: string, postId: string, content: string) => {
    return apiRequest(`/community/posts/${postId}/comment`, {
      method: 'POST',
      token,
      body: { content },
    });
  },
};

// ==================== STATS API ====================

export const statsAPI = {
  get: async (token: string) => {
    return apiRequest('/stats', { token });
  },
};

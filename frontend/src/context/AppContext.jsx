import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { api, apiFetchWithFallback } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { PROJECTS, WORKSTREAMS, TASKS, APPROVALS, RISKS, DECISIONS, SHARED_RULES, LAUNCH_CHECKLIST } from '../data/seed.js';

const initialState = {
  projectId: null,
  audience: 'team',
  projects: [],
  project: null,
  dashboard: null,
  loading: false,
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT_ID':
      return { ...state, projectId: action.payload };
    case 'SET_AUDIENCE':
      return { ...state, audience: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'TOAST_REMOVE':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.payload) };
    default:
      return state;
  }
}

const AppContext = createContext(null);
let toastSequence = 0;

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

function resultsFrom(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function dashboardFallback(projectId) {
  return {
    project: PROJECTS.find((item) => String(item.id) === String(projectId)) || PROJECTS[0],
    workstreams: WORKSTREAMS,
    tasks: TASKS,
    approval_gates: APPROVALS,
    approvals: APPROVALS,
    risks: RISKS,
    decisions: DECISIONS,
    milestones: [],
    launch_readiness: 62,
    next_actions: [],
    blockers: { blocked_workstreams: [], blocked_tasks: [] },
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const pending = useRef(new Map());
  const { user } = useAuth();
  // The team audience exposes internal delivery state, so a client account reads
  // the client audience no matter what it last selected or what the query string
  // says. The backend pins it too; this keeps the UI from ever rendering team
  // data for a client in the first place.
  const audience = user?.is_staff ? state.audience : 'client';

  const showToast = useCallback((message, kind = 'info') => {
    const id = `toast-${++toastSequence}`;
    dispatch({ type: 'TOAST_ADD', payload: { id, message, kind } });
    window.setTimeout(() => dispatch({ type: 'TOAST_REMOVE', payload: id }), 4200);
  }, []);

  const apiCall = useCallback(async (method, path, data) => {
    const key = `${method}:${path}`;
    if (pending.current.has(key)) return pending.current.get(key);
    const request = (async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        return await api[method](path, data);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        pending.current.delete(key);
      }
    })();
    pending.current.set(key, request);
    return request;
  }, []);

  useEffect(() => () => pending.current.clear(), []);

  const loadProjects = useCallback(async () => {
    const data = await apiFetchWithFallback('/projects/', { method: 'GET' }, PROJECTS);
    const projects = resultsFrom(data);
    dispatch({ type: 'SET_PROJECTS', payload: projects });
    return projects;
  }, []);

  const loadProject = useCallback(async (id) => {
    const fallback = PROJECTS.find((item) => String(item.id) === String(id)) || PROJECTS[0];
    const project = await apiFetchWithFallback(`/projects/${id}/`, { method: 'GET' }, fallback);
    dispatch({ type: 'SET_PROJECT', payload: project });
    return project;
  }, []);

  const loadDashboard = useCallback(async (id, requested) => {
    const audienceParam = requested === 'client' ? 'client' : audience;
    const data = await apiFetchWithFallback(
      `/projects/${id}/dashboard/?audience=${audienceParam}`,
      { method: 'GET' },
      dashboardFallback(id),
    );
    dispatch({ type: 'SET_DASHBOARD', payload: data });
    return data;
  }, [audience]);

  const refreshDashboard = useCallback(async () => {
    if (!state.projectId) return state.dashboard;
    return loadDashboard(state.projectId, audience);
  }, [state.projectId, audience, state.dashboard, loadDashboard]);

  const loadWorkstreams = useCallback(async (id) => {
    return apiFetchWithFallback(`/projects/${id}/workstreams/`, { method: 'GET' }, WORKSTREAMS);
  }, []);

  const loadTasks = useCallback(async (id) => {
    const data = await apiFetchWithFallback(
      `/projects/${id}/dashboard/?audience=${audience}`,
      { method: 'GET' },
      dashboardFallback(id),
    );
    return data.tasks || [];
  }, [audience]);

  const loadApprovals = useCallback(async (id) => {
    const data = await apiFetchWithFallback(
      `/projects/${id}/dashboard/?audience=${audience}`,
      { method: 'GET' },
      dashboardFallback(id),
    );
    return data.approval_gates || data.approvals || APPROVALS;
  }, [audience]);

  const loadRisks = useCallback(async (id) => {
    const data = await apiFetchWithFallback(
      `/projects/${id}/dashboard/?audience=${audience}`,
      { method: 'GET' },
      dashboardFallback(id),
    );
    return data.risks || RISKS;
  }, [audience]);

  const loadKnowledge = useCallback(async (id) => {
    const data = await apiFetchWithFallback(
      `/projects/${id}/dashboard/?audience=${audience}`,
      { method: 'GET' },
      dashboardFallback(id),
    );
    return {
      project: data.project || data,
      decisions: data.decisions || data.client_decisions || DECISIONS,
      milestones: data.milestones || [],
      sharedRules: SHARED_RULES,
      launchChecklist: LAUNCH_CHECKLIST,
    };
  }, [audience]);

  const selectProject = useCallback((id) => {
    dispatch({ type: 'SET_PROJECT_ID', payload: id });
  }, []);

  const setAudience = useCallback((audience) => {
    dispatch({ type: 'SET_AUDIENCE', payload: audience });
  }, []);

  const value = useMemo(() => ({
    ...state,
    audience,
    apiCall,
    showToast,
    selectProject,
    setAudience,
    loadProjects,
    loadProject,
    loadDashboard,
    refreshDashboard,
    loadWorkstreams,
    loadTasks,
    loadApprovals,
    loadRisks,
    loadKnowledge,
  }), [
    state,
    audience,
    apiCall,
    showToast,
    selectProject,
    setAudience,
    loadProjects,
    loadProject,
    loadDashboard,
    refreshDashboard,
    loadWorkstreams,
    loadTasks,
    loadApprovals,
    loadRisks,
    loadKnowledge,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

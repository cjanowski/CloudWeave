import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Organization {
  id: string
  name: string
  settings: {
    defaultCloudProvider: string
    costCenter: string
    complianceFrameworks: string[]
  }
}

interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  costCenter: string
  tags: Record<string, string>
}

interface Environment {
  id: string
  projectId: string
  name: string
  type: 'development' | 'staging' | 'production'
  cloudProvider: string
  region: string
}

interface OrganizationState {
  currentOrganization: Organization | null
  projects: Project[]
  environments: Environment[]
  selectedProject: Project | null
  selectedEnvironment: Environment | null
  isLoading: boolean
  error: string | null
}

const initialState: OrganizationState = {
  currentOrganization: null,
  projects: [],
  environments: [],
  selectedProject: null,
  selectedEnvironment: null,
  isLoading: false,
  error: null,
}

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<Organization>) => {
      state.currentOrganization = action.payload
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload
    },
    setEnvironments: (state, action: PayloadAction<Environment[]>) => {
      state.environments = action.payload
    },
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload
      // Clear selected environment when project changes
      if (action.payload?.id !== state.selectedProject?.id) {
        state.selectedEnvironment = null
      }
    },
    setSelectedEnvironment: (state, action: PayloadAction<Environment | null>) => {
      state.selectedEnvironment = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload)
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.projects[index] = action.payload
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload)
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null
        state.selectedEnvironment = null
      }
    },
    addEnvironment: (state, action: PayloadAction<Environment>) => {
      state.environments.push(action.payload)
    },
    updateEnvironment: (state, action: PayloadAction<Environment>) => {
      const index = state.environments.findIndex(e => e.id === action.payload.id)
      if (index !== -1) {
        state.environments[index] = action.payload
      }
    },
    removeEnvironment: (state, action: PayloadAction<string>) => {
      state.environments = state.environments.filter(e => e.id !== action.payload)
      if (state.selectedEnvironment?.id === action.payload) {
        state.selectedEnvironment = null
      }
    },
  },
})

export const {
  setCurrentOrganization,
  setProjects,
  setEnvironments,
  setSelectedProject,
  setSelectedEnvironment,
  setLoading,
  setError,
  addProject,
  updateProject,
  removeProject,
  addEnvironment,
  updateEnvironment,
  removeEnvironment,
} = organizationSlice.actions

export default organizationSlice.reducer
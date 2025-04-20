import React, { createContext, useContext, useReducer, useEffect } from "react";
import { AppState, Alert, Camera } from "../types";
import { generateMockData } from "../utils/mockData";

// Initial state
const initialState: AppState = {
  cameras: [],
  activeCamera: null,
  alerts: [],
  isConnected: false,
  isPredicting: false,
};

// Action types
type Action =
  | { type: "SET_CAMERAS"; payload: Camera[] }
  | { type: "SET_ACTIVE_CAMERA"; payload: string }
  | { type: "ADD_ALERT"; payload: Alert }
  | {
      type: "UPDATE_ALERT_STATUS";
      payload: { id: string; status: Alert["status"] };
    }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_PREDICTION_STATUS"; payload: boolean };

// Reducer
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_CAMERAS":
      return { ...state, cameras: action.payload };
    case "SET_ACTIVE_CAMERA":
      return { ...state, activeCamera: action.payload };
    case "ADD_ALERT":
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case "UPDATE_ALERT_STATUS":
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.payload.id
            ? { ...alert, status: action.payload.status }
            : alert
        ),
      };
    case "MARK_ALL_AS_READ":
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.status === "new" ? { ...alert, status: "reviewing" } : alert
        ),
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload };
    case "SET_PREDICTION_STATUS":
      return { ...state, isPredicting: action.payload };
    default:
      return state;
  }
}

// Context
type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load mock data on mount
  useEffect(() => {
    const { mockCameras, mockAlerts } = generateMockData();
    dispatch({ type: "SET_CAMERAS", payload: mockCameras });

    // Set first camera as active
    if (mockCameras.length > 0) {
      dispatch({ type: "SET_ACTIVE_CAMERA", payload: mockCameras[0].id });
    }

    // Set initial connection status
    dispatch({ type: "SET_CONNECTION_STATUS", payload: true });

    // Add mock alerts
    mockAlerts.forEach((alert) => {
      dispatch({ type: "ADD_ALERT", payload: alert });
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

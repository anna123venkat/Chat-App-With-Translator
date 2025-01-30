import { io } from "socket.io-client";
import React, { createContext } from "react";

const SOCKET_URL = "http://localhost:5001"; // Backend server URL

export const socket = io(SOCKET_URL); // Create a WebSocket connection

// Create React Context for managing global state
export const AppContext = createContext();

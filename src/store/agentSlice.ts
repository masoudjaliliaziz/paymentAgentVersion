import { createSlice } from "@reduxjs/toolkit";
import type { PaymentType } from "../types/apiTypes";

interface AgentState {
  payment: PaymentType[];
  user: string;
  userRole: string;
}

const initialState: AgentState = {
  payment: [],
  user: "",
  userRole: "",
};

const agentSlice = createSlice({
  name: "agentFeature",
  initialState,
  reducers: {
    setPayments(state, action) {
      state.payment = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setUserRole(state, action) {
      state.userRole = action.payload;
    },
  },
});

export const { setPayments, setUser ,setUserRole} = agentSlice.actions;
export default agentSlice.reducer;

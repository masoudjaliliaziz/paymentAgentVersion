import { createSlice } from "@reduxjs/toolkit";
import type { PaymentType } from "../types/apiTypes";

interface AgentState {
  payment: PaymentType[];
}

const initialState: AgentState = {
  payment: [],
};

const agentSlice = createSlice({
  name: "agentFeature",
  initialState,
  reducers: {
    setPayments(state, action) {
      state.payment = action.payload;
    },
  },
});

export const { setPayments } = agentSlice.actions;
export default agentSlice.reducer;

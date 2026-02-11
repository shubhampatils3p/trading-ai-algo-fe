import api from "./client";

export const fetchConfig = async () => {
  const res = await api.get("/config");
  return res.data;
};

export const updateConfig = async (payload) => {
  const res = await api.post("/config", payload);
  return res.data;
};

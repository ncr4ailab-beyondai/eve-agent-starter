import { defineAgent } from "eve";
import { resolveContextWindow, resolveModel } from "./lib/model";

export default defineAgent({
  // Reply-only agent: no shell or file tools.
  defaultTools: false,
  model: resolveModel(process.env),
  modelContextWindowTokens: resolveContextWindow(process.env),
});

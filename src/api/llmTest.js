// src/api/llmTest.js
import config from "../config/index.js";

export function createLLMTestRoute() {
  return async (req, res) => {
    const tests = {
      enabled: config.llm.enabled,
      provider: config.llm.provider,
      model: config.llm.model,
      has_api_key: !!config.llm.apiKey,
      api_key_length: config.llm.apiKey?.length || 0
    };
    
    // Test actual LLM connection if enabled
    if (config.llm.enabled && config.llm.apiKey) {
      try {
        if (config.llm.provider === "openai") {
          const { default: OpenAI } = await import("openai");
          const openai = new OpenAI({ apiKey: config.llm.apiKey });
          
          // Simple test query
          const testResponse = await openai.chat.completions.create({
            model: config.llm.model,
            messages: [
              { role: "system", content: "You are a test assistant. Reply with exactly: LLM_OK" },
              { role: "user", content: "Test" }
            ],
            temperature: 0,
            max_tokens: 10
          });
          
          tests.llm_test = {
            success: true,
            response: testResponse.choices[0].message.content,
            model_used: testResponse.model,
            tokens_used: testResponse.usage?.total_tokens
          };
        }
      } catch (error) {
        tests.llm_test = {
          success: false,
          error: error.message,
          error_type: error.type || error.constructor.name
        };
      }
    } else {
      tests.llm_test = {
        success: false,
        error: "LLM disabled or no API key"
      };
    }
    
    // Test with a difficult player name
    if (req.body?.test_name) {
      try {
        const { NameResolver } = await import("../services/nameResolver.js");
        const { default: store } = await import("../services/testStore.js");
        
        const resolver = new NameResolver(store, config.llm);
        const result = await resolver.resolve(req.body.test_name, { 
          clubHint: req.body.club_hint 
        });
        
        tests.name_resolution = {
          input: req.body.test_name,
          resolved: result ? result.player_name : null,
          used_llm: result?.__llm_resolved || false
        };
      } catch (error) {
        tests.name_resolution = {
          error: error.message
        };
      }
    }
    
    res.json(tests);
  };
}
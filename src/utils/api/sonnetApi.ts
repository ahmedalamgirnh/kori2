
import { toast } from "sonner";

const API_KEY = "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";

export async function callSonnetAPI(prompt: string): Promise<string> {
  try {
    console.log("Calling Sonnet API with prompt:", prompt.substring(0, 100) + "...");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    const responseText = await response.text();
    console.log("Sonnet API raw response:", responseText.substring(0, 100) + "...");
    
    if (!response.ok) {
      console.error("Sonnet API error status:", response.status);
      console.error("Sonnet API error headers:", JSON.stringify(Object.fromEntries([...response.headers])));
      
      try {
        const errorData = JSON.parse(responseText);
        console.error("Parsed Sonnet API error:", errorData);
        
        // Extract specific error information if available
        const errorMessage = errorData.error?.message || 
                            errorData.error?.type || 
                            `API request failed with status ${response.status}`;
        
        throw new Error(errorMessage);
      } catch (e) {
        console.error("Could not parse error as JSON:", e);
        throw new Error(`API request failed with status ${response.status}: ${responseText.substring(0, 100)}...`);
      }
    }

    try {
      const data = JSON.parse(responseText);
      console.log("Sonnet API response parsed successfully");
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error("Unexpected API response format");
      }
      
      return data.content[0].text;
    } catch (parseError) {
      console.error("Error parsing successful response:", parseError);
      throw new Error("Failed to parse API response");
    }
  } catch (error) {
    console.error("Error calling Sonnet API:", error);
    
    // More descriptive error message in the toast
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Sonnet API failed: ${errorMessage}. Falling back to Gemini API.`);
    
    // Fallback to Gemini API if Sonnet fails
    const fallbackResponse = await import("./geminiApi").then(module => 
      module.callChatGPTProxy(prompt)
    );
    
    return fallbackResponse;
  }
}

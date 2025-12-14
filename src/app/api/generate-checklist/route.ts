import { NextResponse } from "next/server";

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video info
async function getVideoInfo(videoId: string): Promise<{ title: string; description: string } | null> {
  try {
    const ytResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    );
    const html = await ytResponse.text();
    
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "Video";
    
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : "";
    
    return { title, description };
  } catch (error) {
    console.error("Error fetching video info:", error);
    return null;
  }
}

// Build the prompt
function buildPrompt(videos: { title: string; description: string; url: string }[], customPrompt: string): string {
  const videoInfo = videos.map((v, i) => 
    `Video ${i + 1}: "${v.title}"\nURL: ${v.url}\n${v.description ? `Description: ${v.description}` : ""}`
  ).join("\n\n");

  return `Create a comprehensive study checklist in Markdown format based on these YouTube video(s).

Format requirements:
- Start with # and a title with emoji
- Use ## for sections
- Use - [ ] for tasks
- Use indentation (2 spaces) for sub-tasks
- Be detailed and actionable

${customPrompt ? `User instructions: ${customPrompt}\n` : ""}
Videos to analyze:
${videoInfo}

Generate the markdown checklist:`;
}

// Call Gemini API
async function callGemini(apiKey: string, prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
  
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { success: true, text };
      }
      
      if (response.status === 400 || response.status === 403) {
        return { success: false, error: "Invalid API key" };
      }
    } catch (err) {
      console.error(`Gemini ${model} error:`, err);
    }
  }
  
  return { success: false, error: "Rate limited on all Gemini models. Wait 2-3 minutes." };
}

// Call Groq API (very fast, generous free tier - 30 req/min)
async function callGroq(apiKey: string, prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert at creating detailed study checklists from YouTube video content. Always use proper markdown formatting with checkboxes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { success: true, text };
    }

    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      return { success: false, error: "Invalid Groq API key. Get one free at console.groq.com" };
    }
    if (response.status === 429) {
      return { success: false, error: "Groq rate limit. Wait a moment and retry." };
    }
    
    return { success: false, error: errorData.error?.message || "Groq API error" };
  } catch (err) {
    console.error("Groq error:", err);
    return { success: false, error: "Network error calling Groq" };
  }
}

// Call OpenRouter API (many free models available)
async function callOpenRouter(apiKey: string, prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://studyflow.app",
        "X-Title": "StudyFlow",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          { role: "system", content: "You are an expert at creating detailed study checklists from YouTube video content. Always use proper markdown formatting with checkboxes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { success: true, text };
    }

    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      return { success: false, error: "Invalid OpenRouter API key. Get one at openrouter.ai" };
    }
    if (response.status === 429) {
      return { success: false, error: "OpenRouter rate limit. Try again in a moment." };
    }
    
    return { success: false, error: errorData.error?.message || "OpenRouter API error" };
  } catch (err) {
    console.error("OpenRouter error:", err);
    return { success: false, error: "Network error calling OpenRouter" };
  }
}

export async function POST(request: Request) {
  try {
    const { apiKey, videoUrls, customPrompt, provider = "gemini" } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    if (!videoUrls || videoUrls.length === 0) {
      return NextResponse.json({ error: "At least one video URL is required" }, { status: 400 });
    }

    // Get video info
    const videos: { title: string; description: string; url: string }[] = [];
    
    for (const url of videoUrls) {
      const videoId = extractVideoId(url.trim());
      if (videoId) {
        const info = await getVideoInfo(videoId);
        if (info) {
          videos.push({ ...info, url: `https://www.youtube.com/watch?v=${videoId}` });
        }
      }
    }

    if (videos.length === 0) {
      return NextResponse.json({ error: "Could not process any video URLs" }, { status: 400 });
    }

    // Build prompt
    const prompt = buildPrompt(videos, customPrompt);

    // Call the appropriate provider
    let result: { success: boolean; text?: string; error?: string };
    
    switch (provider) {
      case "groq":
        result = await callGroq(apiKey, prompt);
        break;
      case "openrouter":
        result = await callOpenRouter(apiKey, prompt);
        break;
      case "gemini":
      default:
        result = await callGemini(apiKey, prompt);
        break;
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to generate checklist" }, { status: 429 });
    }

    // Clean up markdown
    let markdown = result.text!.trim();
    if (markdown.startsWith("```markdown")) {
      markdown = markdown.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
    } else if (markdown.startsWith("```")) {
      markdown = markdown.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error("Error generating checklist:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

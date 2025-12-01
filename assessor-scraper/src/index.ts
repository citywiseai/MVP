import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;
  ANTHROPIC_API_KEY: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let browser;
    
    try {
      const { apn } = await request.json() as { apn?: string };

      if (!apn) {
        return new Response(JSON.stringify({ error: "Missing apn" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!env.ANTHROPIC_API_KEY) {
        return new Response(JSON.stringify({ error: "No API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      const assessorUrl = `https://mcassessor.maricopa.gov/mcs/?q=${apn}&mod=pd`;
      await page.goto(assessorUrl, { waitUntil: "networkidle0", timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a, button, div[role='tab']"));
        const tab = links.find(l => l.textContent?.trim().toUpperCase() === "SKETCHES");
        if (tab && tab instanceof HTMLElement) tab.click();
      });
      await new Promise(r => setTimeout(r, 2000));

      const screenshot = await page.screenshot({ type: "png", fullPage: true });
      await browser.close();
      browser = null;

// Convert screenshot to base64 (chunked to avoid stack overflow)
const uint8Array = new Uint8Array(screenshot as ArrayBuffer);
let binary = '';
const chunkSize = 8192;
for (let i = 0; i < uint8Array.length; i += chunkSize) {
  const chunk = uint8Array.subarray(i, i + chunkSize);
  binary += String.fromCharCode.apply(null, Array.from(chunk));
}
const screenshotBase64 = btoa(binary);
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: screenshotBase64 } },
              { type: "text", text: "RESPOND WITH ONLY JSON. Analyze this Maricopa County Assessor building sketch. INCLUDE in footprint: 1st Floor, Garage, Carport, Covered Patio, Porch, Shed. EXCLUDE from footprint: 2nd Floor, 3rd Floor, Loft, Bonus Room. Return: {\"totalFootprintSF\": <sum of ground-level only>, \"totalAllFloors\": <sum of all>, \"buildingSections\": [{\"name\": \"1st Floor\", \"sqft\": 1198, \"includeInFootprint\": true, \"type\": \"main_floor\"}], \"additionalInfo\": {\"yearBuilt\": null, \"notes\": \"\"}}. If no data: {\"totalFootprintSF\": null, \"totalAllFloors\": null, \"buildingSections\": [], \"additionalInfo\": {\"notes\": \"No sketches found\"}}" },
            ],
          }],
        }),
      });

      if (!claudeResponse.ok) throw new Error("Claude error: " + claudeResponse.status);

      const claudeData = await claudeResponse.json() as { content: Array<{ type: string; text?: string }> };
      let text = claudeData.content[0].text || "";
      
      if (text.includes("```")) {
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      }
      if (!text.startsWith("{")) {
        const match = text.match(/\{[\s\S]*\}/);
        text = match ? match[0] : "{}";
      }

      const data = JSON.parse(text);

      return new Response(JSON.stringify({
        success: true,
        apn,
        assessorUrl,
        totalFootprintSF: data.totalFootprintSF,
        totalBuildingSF: data.totalFootprintSF,
        totalAllFloors: data.totalAllFloors,
        buildingSections: data.buildingSections || [],
        additionalInfo: data.additionalInfo,
        screenshotBase64: "data:image/png;base64," + screenshotBase64,
        message: data.totalFootprintSF ? "Footprint: " + data.totalFootprintSF + " sq ft" : "No data found",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error: unknown) {
      if (browser) try { await browser.close(); } catch(e) {}
      const msg = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
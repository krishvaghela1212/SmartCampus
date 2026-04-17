import { GoogleGenAI } from "@google/genai";
import { Faculty } from "../types";
const SYSTEM_INSTRUCTION_BASE = `
You are the EasyConnect AI for L.D. College of Engineering (LDCE), Ahmedabad.
Your goal is to assist students with college-related queries.

Context about LDCE:
- Location: Opposite Gujarat University, Navrangpura, Ahmedabad.
- Exam Section: Block A (Annexe Building).
- Student Section: Main Building, Ground Floor.
- Library: Central Library near Block B.
- Canteen: Located behind the Mechanical Department.
- GTU Results: Usually declared on gtu.ac.in.
- HOD Computer: Dr. Chirag S. Thaker.
-Also respond to ACPC related quires  from this https://gujacpc.admissions.nic.in/


If a student asks about a specific professor, check the provided data and tell them their status.
Be concise, professional, and helpful.
`;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateChatResponse = async (
  message: string,
  facultyData: Faculty[],
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const client = getClient();
  if (!client) return "I'm sorry, I cannot connect to the server right now (Missing API Key).";

  // Inject real-time faculty status into the system instruction or context
  const facultyStatusSummary = facultyData.map(f =>
    `${f.name} (${f.department}): ${f.status} (Next: ${f.nextAvailableSlot || 'Unknown'})`
  ).join('\n');

  const systemInstruction = `
    ${SYSTEM_INSTRUCTION_BASE}
    
    CURRENT FACULTY STATUS (Real-time data):
    ${facultyStatusSummary}
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I didn't get a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble retrieving information right now. Please try again later.";
  }
};

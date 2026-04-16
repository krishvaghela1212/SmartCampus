
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFaculties } from '../faculty/service.js';

const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

const SYSTEM_INSTRUCTION = `
You are the SmartCampus AI Assistant for L.D. College of Engineering (LDCE), Ahmedabad.

## About LDCE:
- Full Name: Lalbhai Dalpatbhai College of Engineering
- Location: Opposite Gujarat University, Navrangpura, Ahmedabad - 380015
- Established: 1948, one of the oldest engineering colleges in India
- Affiliated to: Gujarat Technological University (GTU)
- Departments: Computer Engineering, Information Technology, Electronics & Communication, Mechanical, Civil, Electrical, Chemical Engineering
- HOD Computer Engineering: Dr. Chirag S. Thaker
- Principal: Dr. N. M. Bhatt
- Website: ldce.ac.in

## Your Capabilities:
1. **Faculty Information**: You have REAL-TIME access to faculty status (Available/Busy/Not Available), and contact details.
2. **Appointment Guidance**: Help students understand how to book appointments with faculty.
3. **Campus Information**: Answer questions about departments, timings, facilities.
4. **Academic Queries**: Provide general guidance about exams, syllabus (GTU), results portal.

## Response Guidelines:
- Be concise but informative (max 2-3 sentences for simple queries)
- When asked about a specific faculty, provide their current status if available
- If a faculty is BUSY, suggest when they might be available next
- For booking appointments, guide them to use the "Book Appointment" button on the faculty card
- Always be polite and professional
- If you don't know something specific, say so and suggest checking the official notice board or website

## Important Links:
- GTU Results: gtu.ac.in/result.aspx
- GTU Syllabus: gtu.ac.in
- LDCE Website: ldce.ac.in
`;

export const chatWithGemini = async (message, history, userContext = {}) => {
    const genAI = getClient();
    if (!genAI) {
        throw new Error("I'm sorry, I cannot connect right now. Please try again later.");
    }

    try {
        // Build comprehensive faculty context
        const faculties = await getFaculties();

        // Create formatted faculty status for the prompt
        const facultyContextString = faculties.length > 0
            ? faculties.map(f => {
                const status = f.availability?.status || f.currentStatus || 'AVAILABLE';
                const nextTime = f.availability?.nextAvailableAt || f.nextAvailableAt;
                const nextAvailableStr = nextTime ? new Date(Number(nextTime)).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Not set';

                return `• ${f.name} (${f.designation || 'Faculty'}, ${f.department})
   - Status: ${status}
   - Next Available: ${nextAvailableStr}
   - Email: ${f.email}`;
            }).join('\n\n')
            : 'No faculty data available at the moment.';

        const currentTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const contextualPrompt = `
${SYSTEM_INSTRUCTION}

## CURRENT DATE & TIME:
${currentTime}

## REAL-TIME FACULTY DATA:
${facultyContextString}

---
User Query: ${message}

Respond helpfully based on the above context. If the query is about a specific faculty member, use the real-time data provided above.
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
                topP: 0.9,
            }
        });

        // Map history to Gemini format (limit to last 10 messages for context)
        const chatHistory = (history || []).slice(-10).map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts?.[0]?.text || '' }]
        }));

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(contextualPrompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error:", error.message || error);

        // Handle specific errors
        if (error.message?.includes('429') || error.message?.includes('quota')) {
            throw new Error("I'm receiving too many requests right now. Please try again in a minute.");
        }
        if (error.message?.includes('API_KEY') || error.message?.includes('401') || error.message?.includes('403')) {
            throw new Error("There's a configuration issue with the API key. Please contact the administrator.");
        }
        if (error.message?.includes('SAFETY')) {
            throw new Error("I couldn't process that request. Please try rephrasing your question.");
        }
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            throw new Error("The AI model is not available. Please contact the administrator.");
        }

        throw new Error("I'm having trouble responding right now. Please try again.");
    }
};

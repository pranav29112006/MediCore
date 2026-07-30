// ─── Gemini AI Service ─────────────────────────────────────────────────────────
// Provides AI-powered clinical summaries and chatbot for doctor recommendations.
// Uses the Gemini REST API directly for maximum compatibility.

import type { Patient, Vital, Diagnosis, Prescription, ClinicalNote, RiskScore } from "./types";

// Try build-time env first, then allow runtime override
let _apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

export function setGeminiApiKey(key: string) {
  _apiKey = key;
}

export function getGeminiApiKey(): string {
  return _apiKey;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash";

export interface PatientContext {
  patient: Patient;
  vitals: Vital[];
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  notes: ClinicalNote[];
  riskScore?: RiskScore;
}

async function callGemini(prompt: string): Promise<string> {
  const key = _apiKey;
  if (!key || key === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("API key not configured");
  }

  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", response.status, error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }
  return text;
}

function buildPatientContextPrompt(ctx: PatientContext): string {
  const { patient, vitals, diagnoses, prescriptions, notes, riskScore } = ctx;
  const latestVital = vitals[vitals.length - 1];

  return `
PATIENT INFORMATION:
- Name: ${patient.fullName}
- Age: ${patient.age} years, Gender: ${patient.gender}
- MRN: ${patient.mrn}
- Blood Group: ${patient.bloodGroup}
- Ward: ${patient.wardName}, Room: ${patient.roomNumber}
- Status: ${patient.status}
- Admission Date: ${new Date(patient.admissionDate).toLocaleDateString()}
- Assigned Doctor: ${patient.assignedDoctorName}
- Risk Level: ${patient.riskLevel}

DIAGNOSES:
${diagnoses.map(d => `- ${d.name} (${d.icdCode}) — Severity: ${d.severity}, Status: ${d.status}\n  ${d.description}`).join("\n")}

CURRENT MEDICATIONS:
${prescriptions.map(rx => `- ${rx.medicationName} ${rx.dosage} — ${rx.frequency} (${rx.route}) [${rx.status}]`).join("\n")}

${latestVital ? `LATEST VITALS:
- BP: ${latestVital.bpSystolic}/${latestVital.bpDiastolic} mmHg
- Heart Rate: ${latestVital.heartRate} bpm
- SpO2: ${latestVital.spo2}%
- Temperature: ${latestVital.temperature}°C
- Respiratory Rate: ${latestVital.respiratoryRate}/min
- Recorded: ${new Date(latestVital.recordedAt).toLocaleString()}` : "No vitals recorded."}

${riskScore ? `AI RISK ASSESSMENT:
- Score: ${riskScore.numericScore}/100 (${riskScore.score})
- Explanation: ${riskScore.explanation}
- Risk Factors: ${riskScore.factors.join(", ")}` : ""}

RECENT CLINICAL NOTES:
${notes.slice(0, 5).map(n => `- [${n.noteType}] ${n.authorName} (${new Date(n.createdAt).toLocaleString()}): ${n.content}`).join("\n")}
`.trim();
}

export async function summarizePatient(ctx: PatientContext): Promise<string> {
  try {
    const contextPrompt = buildPatientContextPrompt(ctx);

    const result = await callGemini(`
You are a senior clinical AI assistant in a hospital. Given the following patient data, provide a concise but comprehensive clinical summary for the attending doctor. Include:

1. **Patient Overview** — Brief summary of who the patient is and why they're admitted
2. **Current Status** — Assessment of current vitals and their trends
3. **Active Issues** — Key clinical concerns and risk factors
4. **Treatment Summary** — What medications are being administered and their purpose
5. **Recommendations** — Suggested next steps, things to watch for, or potential adjustments

Keep the tone professional and clinical. Use bullet points for clarity. Be specific with numbers and clinical values.

${contextPrompt}
    `.trim());

    return result;
  } catch (error) {
    console.error("Summarize error:", error);
    return generateFallbackSummary(ctx);
  }
}

export async function chatWithAI(
  message: string,
  ctx: PatientContext,
  chatHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  try {
    const contextPrompt = buildPatientContextPrompt(ctx);

    const historyText = chatHistory
      .slice(-6)
      .map(h => `${h.role === "user" ? "Doctor" : "AI Assistant"}: ${h.content}`)
      .join("\n\n");

    const result = await callGemini(`
You are a senior clinical AI assistant in a hospital setting. You are helping the attending doctor with recommendations and clinical decision support for the following patient.

${contextPrompt}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}\n` : ""}

Doctor's Question: ${message}

Provide helpful, evidence-based clinical recommendations. Be specific and reference the patient's data when relevant. If the question involves medication changes, mention potential interactions with current medications. Keep your response concise and actionable. Use markdown formatting for clarity.
    `.trim());

    return result;
  } catch (error) {
    console.error("Chat error:", error);
    return generateFallbackChat(message, ctx);
  }
}

// ─── Fallback responses when API key is not configured ────────────────────────

function generateFallbackSummary(ctx: PatientContext): string {
  const { patient, vitals, diagnoses, prescriptions, riskScore } = ctx;
  const latestVital = vitals[vitals.length - 1];

  let summary = `## Clinical Summary — ${patient.fullName}\n\n`;
  summary += `**Patient Overview:** ${patient.age}y/${patient.gender[0].toUpperCase()}, admitted to ${patient.wardName} (Room ${patient.roomNumber}) `;
  summary += `with primary diagnosis of ${diagnoses[0]?.name || "pending evaluation"}. `;
  summary += `Currently ${patient.status.replace("_", " ")}.\n\n`;

  if (latestVital) {
    const bpStatus = latestVital.bpSystolic > 140 ? "elevated" : latestVital.bpSystolic < 90 ? "low" : "within normal range";
    const spo2Status = latestVital.spo2 < 92 ? "critically low" : latestVital.spo2 < 95 ? "below target" : "adequate";
    summary += `**Current Vitals:**\n`;
    summary += `- BP ${latestVital.bpSystolic}/${latestVital.bpDiastolic} mmHg (${bpStatus})\n`;
    summary += `- HR ${latestVital.heartRate} bpm, SpO2 ${latestVital.spo2}% (${spo2Status})\n`;
    summary += `- Temp ${latestVital.temperature}°C, RR ${latestVital.respiratoryRate}/min\n\n`;
  }

  if (riskScore) {
    summary += `**Risk Assessment:** ${riskScore.score.toUpperCase()} risk (${riskScore.numericScore}/100)\n`;
    summary += `- Factors: ${riskScore.factors.join(", ")}\n\n`;
  }

  summary += `**Active Medications:** ${prescriptions.filter(p => p.status === "active").length} active prescriptions\n`;
  prescriptions.filter(p => p.status === "active").slice(0, 5).forEach(rx => {
    summary += `- ${rx.medicationName} ${rx.dosage} (${rx.frequency})\n`;
  });

  summary += `\n**Recommendations:**\n`;
  if (latestVital && latestVital.spo2 < 92) {
    summary += `- ⚠️ SpO2 critically low — consider increasing oxygen support\n`;
  }
  if (latestVital && latestVital.bpSystolic > 160) {
    summary += `- ⚠️ Hypertensive — review antihypertensive regimen\n`;
  }
  if (latestVital && latestVital.heartRate > 120) {
    summary += `- ⚠️ Tachycardia — investigate underlying cause\n`;
  }
  summary += `- Continue monitoring vitals Q4H\n`;
  summary += `- Review lab results when available\n`;

  return summary;
}

function generateFallbackChat(message: string, ctx: PatientContext): string {
  const msg = message.toLowerCase();
  const { patient, diagnoses, prescriptions, vitals } = ctx;
  const latestVital = vitals[vitals.length - 1];

  if (msg.includes("interaction") || msg.includes("drug")) {
    const meds = prescriptions.filter(p => p.status === "active").map(p => p.medicationName);
    return `**Medication Interaction Review for ${patient.fullName}:**\n\n` +
      `Current active medications: ${meds.join(", ")}.\n\n` +
      `⚠️ *Note: For a comprehensive interaction check, please configure your Gemini API key for AI-powered analysis.*\n\n` +
      `**General precautions:**\n` +
      `- Monitor renal and hepatic function with concurrent medications\n` +
      `- Watch for additive effects on blood pressure\n` +
      `- Review timing of oral medications for optimal absorption`;
  }

  if (msg.includes("alternative") || msg.includes("suggest") || msg.includes("recommend")) {
    return `**Treatment Recommendations for ${patient.fullName}:**\n\n` +
      `Current primary diagnosis: ${diagnoses[0]?.name || "N/A"} (${diagnoses[0]?.severity || "N/A"})\n\n` +
      `⚠️ *For detailed AI-powered treatment recommendations, please configure your Gemini API key.*\n\n` +
      `**General approach:**\n` +
      `- Continue current treatment protocol\n` +
      `- Consider specialist consultation if no improvement in 48-72h\n` +
      `- Monitor for treatment response via serial vitals and labs`;
  }

  if (msg.includes("vital") || msg.includes("status") || msg.includes("condition")) {
    if (latestVital) {
      return `**Current Condition of ${patient.fullName}:**\n\n` +
        `- BP: ${latestVital.bpSystolic}/${latestVital.bpDiastolic} mmHg\n` +
        `- HR: ${latestVital.heartRate} bpm\n` +
        `- SpO2: ${latestVital.spo2}%\n` +
        `- Temp: ${latestVital.temperature}°C\n` +
        `- RR: ${latestVital.respiratoryRate}/min\n\n` +
        `Risk Level: **${patient.riskLevel.toUpperCase()}**`;
    }
  }

  return `I can help with clinical recommendations for **${patient.fullName}** (${diagnoses[0]?.name || "pending diagnosis"}).\n\n` +
    `Try asking about:\n` +
    `- Medication interactions\n` +
    `- Treatment alternatives\n` +
    `- Current patient status\n` +
    `- Dosage adjustments\n\n` +
    `💡 *For full AI-powered responses, add your Gemini API key to the .env file.*`;
}

export function isGeminiConfigured(): boolean {
  return !!_apiKey && _apiKey !== "YOUR_GEMINI_API_KEY_HERE";
}

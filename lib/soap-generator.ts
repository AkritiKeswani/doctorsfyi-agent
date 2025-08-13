import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { medicalCodingService, type MedicalCoding } from "./medical-codes"

export interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  timestamp: number
  confidence: number
  medicalCoding?: MedicalCoding
}

export interface SOAPGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  includeCoding?: boolean
}

export class SOAPGenerator {
  private options: SOAPGenerationOptions

  constructor(options: SOAPGenerationOptions = {}) {
    this.options = {
      model: options.model || "gpt-4o",
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 1500,
      includeCoding: options.includeCoding ?? true,
    }
  }

  async generateSOAPNote(transcription: string): Promise<SOAPNote> {
    if (!transcription.trim()) {
      throw new Error("Transcription is empty")
    }

    try {
      const prompt = this.buildPrompt(transcription)

      const { text } = await generateText({
        model: openai(this.options.model!),
        prompt,
        temperature: this.options.temperature,
        maxTokens: this.options.maxTokens,
      })

      const soapNote = this.parseSOAPResponse(text)

      if (this.options.includeCoding && soapNote.assessment && soapNote.plan) {
        try {
          const medicalCoding = await medicalCodingService.generateMedicalCodes(
            soapNote.assessment,
            soapNote.plan,
            soapNote.subjective,
            soapNote.objective,
          )
          soapNote.medicalCoding = medicalCoding
        } catch (error) {
          console.error("Failed to generate medical codes:", error)
          // Continue without medical coding if it fails
        }
      }

      return soapNote
    } catch (error) {
      console.error("Error generating SOAP note:", error)
      throw new Error("Failed to generate SOAP note")
    }
  }

  private buildPrompt(transcription: string): string {
    return `You are a medical AI assistant specialized in creating SOAP notes from doctor-patient conversations. 

Analyze the following medical conversation transcript and create a structured SOAP note:

TRANSCRIPT:
${transcription}

Please structure your response in the following format:

SUBJECTIVE:
[Patient's reported symptoms, concerns, history, and subjective information]

OBJECTIVE:
[Observable findings, vital signs, physical examination results, test results]

ASSESSMENT:
[Clinical impression, differential diagnosis, working diagnosis]

PLAN:
[Treatment plan, medications, follow-up, patient education, referrals]

Guidelines:
- Only include information that is explicitly mentioned in the transcript
- If a section has no relevant information, write "No specific information provided"
- Use clear, concise medical language
- Maintain patient confidentiality
- Focus on clinically relevant information
- Do not make assumptions beyond what is stated in the conversation

Provide only the SOAP note content without additional commentary.`
  }

  private parseSOAPResponse(response: string): SOAPNote {
    const sections = {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    }

    // Parse the response to extract each SOAP section
    const lines = response.split("\n")
    let currentSection = ""

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (trimmedLine.toUpperCase().startsWith("SUBJECTIVE:")) {
        currentSection = "subjective"
        sections.subjective = trimmedLine.replace(/^SUBJECTIVE:\s*/i, "")
      } else if (trimmedLine.toUpperCase().startsWith("OBJECTIVE:")) {
        currentSection = "objective"
        sections.objective = trimmedLine.replace(/^OBJECTIVE:\s*/i, "")
      } else if (trimmedLine.toUpperCase().startsWith("ASSESSMENT:")) {
        currentSection = "assessment"
        sections.assessment = trimmedLine.replace(/^ASSESSMENT:\s*/i, "")
      } else if (trimmedLine.toUpperCase().startsWith("PLAN:")) {
        currentSection = "plan"
        sections.plan = trimmedLine.replace(/^PLAN:\s*/i, "")
      } else if (trimmedLine && currentSection) {
        // Add content to the current section
        sections[currentSection as keyof typeof sections] +=
          (sections[currentSection as keyof typeof sections] ? " " : "") + trimmedLine
      }
    }

    return {
      subjective: sections.subjective || "No specific information provided",
      objective: sections.objective || "No specific information provided",
      assessment: sections.assessment || "No specific information provided",
      plan: sections.plan || "No specific information provided",
      timestamp: Date.now(),
      confidence: 0.85, // Default confidence score
    }
  }

  async generateIncrementalSOAP(transcription: string, previousSOAP?: SOAPNote): Promise<SOAPNote> {
    // For incremental updates, we can compare with previous SOAP and only update changed sections
    if (!previousSOAP) {
      return this.generateSOAPNote(transcription)
    }

    // Generate new SOAP note and merge with previous one intelligently
    const newSOAP = await this.generateSOAPNote(transcription)

    return {
      subjective:
        newSOAP.subjective !== "No specific information provided" ? newSOAP.subjective : previousSOAP.subjective,
      objective: newSOAP.objective !== "No specific information provided" ? newSOAP.objective : previousSOAP.objective,
      assessment:
        newSOAP.assessment !== "No specific information provided" ? newSOAP.assessment : previousSOAP.assessment,
      plan: newSOAP.plan !== "No specific information provided" ? newSOAP.plan : previousSOAP.plan,
      timestamp: Date.now(),
      confidence: Math.max(newSOAP.confidence, previousSOAP.confidence),
      medicalCoding: newSOAP.medicalCoding || previousSOAP.medicalCoding,
    }
  }
}

// Global SOAP generator instance
export const soapGenerator = new SOAPGenerator({
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1500,
  includeCoding: true,
})

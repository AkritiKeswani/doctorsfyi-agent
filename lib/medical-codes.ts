import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface MedicalCode {
  code: string
  description: string
  confidence: number
  category?: string
}

export interface ICD10Code extends MedicalCode {
  type: "diagnosis"
  severity?: "primary" | "secondary"
}

export interface CPTCode extends MedicalCode {
  type: "procedure"
  units?: number
  modifier?: string
}

export interface MedicalCoding {
  icd10Codes: ICD10Code[]
  cptCodes: CPTCode[]
  timestamp: number
  confidence: number
}

export class MedicalCodingService {
  private model: string

  constructor(model = "gpt-4o") {
    this.model = model
  }

  async generateMedicalCodes(
    assessment: string,
    plan: string,
    subjective?: string,
    objective?: string,
  ): Promise<MedicalCoding> {
    try {
      const prompt = this.buildCodingPrompt(assessment, plan, subjective, objective)

      const { text } = await generateText({
        model: openai(this.model),
        prompt,
        temperature: 0.2, // Lower temperature for more consistent coding
        maxTokens: 1000,
      })

      return this.parseCodingResponse(text)
    } catch (error) {
      console.error("Error generating medical codes:", error)
      throw new Error("Failed to generate medical codes")
    }
  }

  private buildCodingPrompt(assessment: string, plan: string, subjective?: string, objective?: string): string {
    return `You are a medical coding specialist AI. Analyze the following SOAP note sections and suggest appropriate ICD-10 diagnostic codes and CPT procedure codes.

SUBJECTIVE: ${subjective || "Not provided"}
OBJECTIVE: ${objective || "Not provided"}
ASSESSMENT: ${assessment}
PLAN: ${plan}

Please provide your response in the following JSON format:

{
  "icd10_codes": [
    {
      "code": "ICD-10 code",
      "description": "Full description of the diagnosis",
      "confidence": 0.85,
      "severity": "primary" or "secondary"
    }
  ],
  "cpt_codes": [
    {
      "code": "CPT code",
      "description": "Description of the procedure/service",
      "confidence": 0.90,
      "units": 1,
      "modifier": "modifier if applicable"
    }
  ]
}

Guidelines:
- Only suggest codes that are clearly supported by the documentation
- Use current ICD-10-CM codes (2024 version)
- Use current CPT codes (2024 version)
- Assign confidence scores based on documentation clarity (0.0-1.0)
- Mark primary vs secondary diagnoses appropriately
- Include evaluation and management (E/M) codes when appropriate
- Do not suggest codes for conditions not explicitly documented
- If no clear codes can be determined, return empty arrays

Provide only the JSON response without additional commentary.`
  }

  private parseCodingResponse(response: string): MedicalCoding {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response")
      }

      const parsed = JSON.parse(jsonMatch[0])

      const icd10Codes: ICD10Code[] = (parsed.icd10_codes || []).map((code: any) => ({
        code: code.code,
        description: code.description,
        confidence: code.confidence || 0.5,
        type: "diagnosis" as const,
        severity: code.severity || "primary",
        category: this.getICD10Category(code.code),
      }))

      const cptCodes: CPTCode[] = (parsed.cpt_codes || []).map((code: any) => ({
        code: code.code,
        description: code.description,
        confidence: code.confidence || 0.5,
        type: "procedure" as const,
        units: code.units || 1,
        modifier: code.modifier,
        category: this.getCPTCategory(code.code),
      }))

      return {
        icd10Codes,
        cptCodes,
        timestamp: Date.now(),
        confidence: this.calculateOverallConfidence(icd10Codes, cptCodes),
      }
    } catch (error) {
      console.error("Error parsing medical codes response:", error)
      return {
        icd10Codes: [],
        cptCodes: [],
        timestamp: Date.now(),
        confidence: 0,
      }
    }
  }

  private getICD10Category(code: string): string {
    const firstChar = code.charAt(0).toUpperCase()
    const categories: { [key: string]: string } = {
      A: "Infectious diseases",
      B: "Infectious diseases",
      C: "Neoplasms",
      D: "Blood disorders",
      E: "Endocrine disorders",
      F: "Mental disorders",
      G: "Nervous system",
      H: "Eye/Ear disorders",
      I: "Circulatory system",
      J: "Respiratory system",
      K: "Digestive system",
      L: "Skin disorders",
      M: "Musculoskeletal",
      N: "Genitourinary system",
      O: "Pregnancy/Childbirth",
      P: "Perinatal conditions",
      Q: "Congenital malformations",
      R: "Symptoms/Signs",
      S: "Injury/Poisoning",
      T: "Injury/Poisoning",
      V: "External causes",
      W: "External causes",
      X: "External causes",
      Y: "External causes",
      Z: "Health status factors",
    }
    return categories[firstChar] || "Other"
  }

  private getCPTCategory(code: string): string {
    const codeNum = Number.parseInt(code)
    if (codeNum >= 99202 && codeNum <= 99499) return "Evaluation & Management"
    if (codeNum >= 10021 && codeNum <= 69990) return "Surgery"
    if (codeNum >= 70010 && codeNum <= 79999) return "Radiology"
    if (codeNum >= 80047 && codeNum <= 89398) return "Pathology & Laboratory"
    if (codeNum >= 90281 && codeNum <= 99607) return "Medicine"
    return "Other"
  }

  private calculateOverallConfidence(icd10Codes: ICD10Code[], cptCodes: CPTCode[]): number {
    const allCodes = [...icd10Codes, ...cptCodes]
    if (allCodes.length === 0) return 0

    const totalConfidence = allCodes.reduce((sum, code) => sum + code.confidence, 0)
    return totalConfidence / allCodes.length
  }
}

// Global medical coding service instance
export const medicalCodingService = new MedicalCodingService("gpt-4o")

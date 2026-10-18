/**
 * Tipos y contratos de datos para la integracion del sistema de patologia digital.
 * Reflejan los esquemas Pydantic del backend FastAPI y las entidades de base de datos.
 */

export interface MetadataResponse {
    request_id: string;
    original_filename: string;
    mode: 'benchmark' | 'hospital';
    watershed: boolean;
}

export interface AnalyticsResponse {
    total_nuclei_detected: number;
    positive_nuclei_count: number;
    negative_nuclei_count: number;
    positivity_index_percentage: number;
    positive_area_px: number;
    negative_area_px: number;
}

export interface ClinicalRiskResponse {
    level: 'LOW' | 'MODERATE' | 'HIGH' | string;
    color_code: string;
    description: string;
}

export interface VisualPayloadsResponse {
    synthetic_ihc_url: string;
    audit_canvas_url: string;
    score_cam_url: string;
}

export interface QuantifyResponse {
    status: 'success' | 'error' | string;
    metadata: MetadataResponse;
    analytics: AnalyticsResponse;
    clinical_risk: ClinicalRiskResponse;
    visual_payloads: VisualPayloadsResponse;
}

export interface HealthResponse {
    status: string;
    gpu_available: boolean;
    model_loaded: boolean;
    device: string;
}

export interface HistoryRecord {
    id: string;
    request_id: string;
    nombre_archivo: string;
    date: string;
    total_nuclei: number;
    positive_nuclei: number;
    positivity_index: number;
    risk_level: string;
    usuario_id?: string;
    medico_nombre?: string;
}

export interface UserProfileRecord {
    id: string;
    email: string;
    nombre_completo: string;
    rol: 'admin' | 'patologo';
    created_at: string;
}

export interface DiagnosticsSaveInput {
    request_id: string;
    nombre_archivo: string;
    total_nuclei: number;
    positive_nuclei: number;
    positivity_index: number;
    risk_level: string;
}

export interface ActionResponse {
    success: boolean;
    error?: string;
    message?: string;
}

export interface QueueItem {
    id: number;
    name: string;
    file: File;
    status: 'espera' | 'procesando' | 'completado' | 'error';
    errorDetail?: string;
    syntheticIhc: string | null;
    auditCanvas: string | null;
    scoreCam: string | null;
    positivityIndex: number | null;
    riskLevel: string | null;
    riskColor: string | null;
}

export type ViewType = 'IHC Sintética' | 'Auditoría HSV' | 'Score-CAM';

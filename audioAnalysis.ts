const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

let pitchClassHistogram: number[] = new Array(12).fill(0);
let pitchClassWeights: number[] = new Array(12).fill(0);
let histogramUpdateCount = 0;
const HISTOGRAM_WINDOW = 30;
const DECAY_FACTOR = 0.98;
const MIN_CONFIDENCE_THRESHOLD = 0.15;

let previousLoudness: number | null = null;
let previousSpectralCentroid: number | null = null;
let previousMagnitudeSpectrum: number[] | null = null;

let currentKey: string = 'Detecting...';
let currentKeyConfidence: number = 0;
let keyStabilityCounter: number = 0;
const KEY_STABILITY_THRESHOLD = 3;

// Perfectly balanced hue distribution across the full 360-degree spectrum
// Each note is evenly spaced at 30-degree intervals to ensure vibrant, distinct colors
// This creates maximum color separation and eliminates any single hue dominance
const NOTE_BASE_HUES: Record<string, number> = {
    'C': 0,      // Red - warm, energetic
    'C#': 30,    // Orange-Red - vibrant, bold
    'D': 60,     // Orange-Yellow - bright, cheerful
    'D#': 90,    // Yellow - luminous, clear
    'E': 120,    // Yellow-Green - fresh, lively
    'F': 150,    // Green - balanced, natural
    'F#': 180,   // Cyan - cool, crisp
    'G': 210,    // Light Blue - calm, clear
    'G#': 240,   // Blue - deep, rich
    'A': 270,    // Purple - royal, mysterious
    'A#': 300,   // Magenta - bold, striking
    'B': 330     // Pink-Red - warm, passionate
};

export function analyzeAudio(
    frequencyData: Uint8Array,
    timeData: Float32Array,
    sampleRate: number
): {
    loudnessDelta: number;
    spectralCentroidDelta: number;
    spectralFlux: number;
    key: string;
    keyConfidence: number;
    color: string;
    note: string;
} {
    const loudness = calculateLoudness(timeData);
    const spectralCentroid = calculateSpectralCentroid(frequencyData, sampleRate);
    const spectralFlux = calculateSpectralFlux(frequencyData);
    
    const loudnessDelta = previousLoudness !== null ? loudness - previousLoudness : 0;
    const spectralCentroidDelta = previousSpectralCentroid !== null ? spectralCentroid - previousSpectralCentroid : 0;
    
    previousLoudness = loudness;
    previousSpectralCentroid = spectralCentroid;
    
    const pitch = detectPitch(timeData, sampleRate);
    const note = pitchToNote(pitch);
    
    if (pitch > 0) {
        const weight = calculatePitchWeight(loudness, spectralCentroid);
        updatePitchClassHistogram(pitch, weight);
    }
    
    const { key, confidence } = detectKey();
    
    // Use note-based color mapping for individual detected notes
    const color = getNoteBasedColor(note, loudnessDelta, spectralCentroidDelta, spectralFlux);

    return { 
        loudnessDelta, 
        spectralCentroidDelta, 
        spectralFlux, 
        key, 
        keyConfidence: confidence,
        color, 
        note 
    };
}

function calculateLoudness(timeData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
        sum += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(sum / timeData.length);
    
    if (rms === 0) return -100;
    
    const dBFS = 20 * Math.log10(rms);
    return Math.max(-100, dBFS);
}

function calculateSpectralCentroid(frequencyData: Uint8Array, sampleRate: number): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
        const frequency = (i * sampleRate) / (2 * frequencyData.length);
        const magnitude = frequencyData[i];
        
        weightedSum += frequency * magnitude;
        magnitudeSum += magnitude;
    }
    
    if (magnitudeSum === 0) return 0;
    
    return weightedSum / magnitudeSum;
}

function calculateSpectralFlux(frequencyData: Uint8Array): number {
    const currentMagnitudes = Array.from(frequencyData);
    
    if (previousMagnitudeSpectrum === null) {
        previousMagnitudeSpectrum = currentMagnitudes;
        return 0;
    }
    
    let flux = 0;
    for (let i = 0; i < currentMagnitudes.length; i++) {
        const diff = currentMagnitudes[i] - previousMagnitudeSpectrum[i];
        flux += diff;
    }
    
    previousMagnitudeSpectrum = currentMagnitudes;
    
    return flux / currentMagnitudes.length;
}

function detectPitch(timeData: Float32Array, sampleRate: number): number {
    const bufferSize = timeData.length;
    
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) {
        rms += timeData[i] * timeData[i];
    }
    rms = Math.sqrt(rms / bufferSize);

    if (rms < 0.015) return 0;

    const normalizedData = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
        normalizedData[i] = timeData[i] / (rms + 0.001);
    }

    let maxCorrelation = 0;
    let bestOffset = -1;

    const minOffset = Math.floor(sampleRate / 1200);
    const maxOffset = Math.floor(sampleRate / 40);

    for (let offset = minOffset; offset < maxOffset && offset < bufferSize / 2; offset++) {
        let correlation = 0;
        let count = 0;
        
        for (let i = 0; i < bufferSize / 2; i++) {
            const diff = normalizedData[i] - normalizedData[i + offset];
            correlation += diff * diff;
            count++;
        }
        
        correlation = 1 - Math.sqrt(correlation / count);

        if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestOffset = offset;
        }
    }

    if (maxCorrelation > 0.5 && bestOffset !== -1) {
        const frequency = sampleRate / bestOffset;
        
        if (frequency >= 40 && frequency <= 1200) {
            return frequency;
        }
    }

    return 0;
}

function pitchToNote(frequency: number): string {
    if (frequency === 0) return 'N/A';

    const A4 = 440;
    const halfSteps = 12 * Math.log2(frequency / A4);
    const noteIndex = Math.round(halfSteps) % 12;
    const adjustedIndex = noteIndex < 0 ? noteIndex + 12 : noteIndex;

    return NOTE_NAMES[adjustedIndex];
}

// Get color for individual notes (used for 3D visualization points)
function getNoteBasedColor(note: string, loudnessDelta: number, spectralCentroidDelta: number, spectralFlux: number): string {
    // If no note detected, use a neutral color
    if (note === 'N/A') {
        return 'oklch(0.60 0.15 200)';
    }

    // Get base hue from note
    let baseHue = NOTE_BASE_HUES[note] ?? 0;

    // Add variation based on audio metrics to create dynamic colors within the note's hue range
    const normalizedLoudness = Math.max(0, Math.min(1, (loudnessDelta + 20) / 40));
    const normalizedCentroid = Math.max(0, Math.min(1, (spectralCentroidDelta + 2000) / 4000));
    const normalizedFlux = Math.max(0, Math.min(1, (spectralFlux + 50) / 100));
    
    // Add subtle hue variation (±8 degrees) based on audio metrics to stay within the note's color range
    const hueVariation = (normalizedLoudness - 0.5) * 8 + (normalizedCentroid - 0.5) * 5;
    let hue = (baseHue + hueVariation) % 360;
    if (hue < 0) hue += 360;

    // Use bright, vivid colors for individual notes
    // Lightness: 0.70-0.78 for brightness and clarity
    // Chroma: 0.38-0.46 for strong vibrancy
    const lightnessBase = 0.74;
    const lightnessVariation = (normalizedLoudness * 0.04) + (normalizedFlux * 0.02) - 0.03;
    const lightness = Math.max(0.70, Math.min(0.78, lightnessBase + lightnessVariation));

    const chromaBase = 0.42;
    const chromaVariation = (normalizedCentroid * 0.04) + (normalizedFlux * 0.02) - 0.03;
    const chroma = Math.max(0.38, Math.min(0.46, chromaBase + chromaVariation));

    return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue.toFixed(0)})`;
}

// Get color for musical keys (used for key detection display)
export function getKeyBasedColor(key: string): string {
    // If key is not detected yet, use a neutral color
    if (key === 'Detecting...' || key === 'N/A') {
        return 'oklch(0.60 0.15 200)';
    }

    // Parse the key to extract note and mode
    const keyParts = key.split(' ');
    const noteName = keyParts[0];
    const mode = keyParts[1]; // 'major' or 'minor'
    const isMajor = mode === 'major';

    // Get base hue from note
    let baseHue = 0;
    for (const [note, hue] of Object.entries(NOTE_BASE_HUES)) {
        if (noteName === note || noteName === NOTE_NAMES_FLAT[NOTE_NAMES.indexOf(note)]) {
            baseHue = hue;
            break;
        }
    }

    // Enhanced dual-tier color mapping with perfectly balanced, vibrant colors
    let lightness: number;
    let chroma: number;

    if (isMajor) {
        // Major keys: bright, rich, highly vivid colors with strong saturation
        lightness = 0.76;
        chroma = 0.44;
    } else {
        // Minor keys: darker, well-saturated colors that remain distinct and vibrant
        lightness = 0.59;
        chroma = 0.32;
    }

    return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${baseHue.toFixed(0)})`;
}

// Get color for individual notes (used for note badges and legend)
export function getNoteColor(note: string): string {
    if (note === 'N/A') {
        return 'oklch(0.60 0.15 200)';
    }

    // Get base hue from note
    let baseHue = NOTE_BASE_HUES[note] ?? 0;

    // Use bright, vivid colors for individual notes
    const lightness = 0.74;
    const chroma = 0.42;

    return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${baseHue.toFixed(0)})`;
}

function calculatePitchWeight(loudness: number, spectralCentroid: number): number {
    const loudnessWeight = Math.max(0, Math.min(1, (loudness + 40) / 40));
    const spectralWeight = Math.max(0.5, Math.min(1, spectralCentroid / 3000));
    
    return loudnessWeight * spectralWeight;
}

function updatePitchClassHistogram(frequency: number, weight: number): void {
    const A4 = 440;
    const halfSteps = 12 * Math.log2(frequency / A4);
    const noteIndex = Math.round(halfSteps) % 12;
    const adjustedIndex = noteIndex < 0 ? noteIndex + 12 : noteIndex;

    for (let i = 0; i < 12; i++) {
        pitchClassHistogram[i] *= DECAY_FACTOR;
        pitchClassWeights[i] *= DECAY_FACTOR;
    }

    pitchClassHistogram[adjustedIndex] += weight;
    pitchClassWeights[adjustedIndex] += weight;
    histogramUpdateCount++;

    if (histogramUpdateCount > HISTOGRAM_WINDOW * 3) {
        const maxVal = Math.max(...pitchClassHistogram);
        if (maxVal > 100) {
            for (let i = 0; i < 12; i++) {
                pitchClassHistogram[i] /= maxVal;
                pitchClassWeights[i] /= maxVal;
            }
        }
    }
}

function detectKey(): { key: string; confidence: number } {
    if (histogramUpdateCount < 5) {
        return { key: 'Detecting...', confidence: 0 };
    }

    const total = pitchClassHistogram.reduce((sum, val) => sum + val, 0);
    if (total < 0.1) {
        return { key: 'N/A', confidence: 0 };
    }

    const normalizedHistogram = pitchClassHistogram.map(val => val / total);

    let bestKey = 'C major';
    let bestCorrelation = -Infinity;
    let secondBestCorrelation = -Infinity;

    for (let tonic = 0; tonic < 12; tonic++) {
        const majorCorrelation = calculateCorrelation(normalizedHistogram, MAJOR_PROFILE, tonic);
        if (majorCorrelation > bestCorrelation) {
            secondBestCorrelation = bestCorrelation;
            bestCorrelation = majorCorrelation;
            bestKey = `${getKeyName(tonic, true)} major`;
        } else if (majorCorrelation > secondBestCorrelation) {
            secondBestCorrelation = majorCorrelation;
        }

        const minorCorrelation = calculateCorrelation(normalizedHistogram, MINOR_PROFILE, tonic);
        if (minorCorrelation > bestCorrelation) {
            secondBestCorrelation = bestCorrelation;
            bestCorrelation = minorCorrelation;
            bestKey = `${getKeyName(tonic, false)} minor`;
        } else if (minorCorrelation > secondBestCorrelation) {
            secondBestCorrelation = minorCorrelation;
        }
    }

    const separation = bestCorrelation - secondBestCorrelation;
    const confidence = Math.max(0, Math.min(1, bestCorrelation));

    if (bestCorrelation > MIN_CONFIDENCE_THRESHOLD) {
        if (bestKey === currentKey) {
            keyStabilityCounter++;
        } else {
            if (separation > 0.1 && confidence > 0.3) {
                keyStabilityCounter = 1;
                if (keyStabilityCounter >= KEY_STABILITY_THRESHOLD) {
                    currentKey = bestKey;
                    currentKeyConfidence = confidence;
                }
            } else {
                keyStabilityCounter = 0;
            }
        }
    } else {
        keyStabilityCounter = 0;
    }

    return { 
        key: keyStabilityCounter >= KEY_STABILITY_THRESHOLD ? currentKey : 'Detecting...', 
        confidence: keyStabilityCounter >= KEY_STABILITY_THRESHOLD ? currentKeyConfidence : confidence 
    };
}

function calculateCorrelation(histogram: number[], profile: number[], tonic: number): number {
    const rotatedProfile = [...profile.slice(tonic), ...profile.slice(0, tonic)];

    const profileSum = rotatedProfile.reduce((sum, val) => sum + val, 0);
    const normalizedProfile = rotatedProfile.map(val => val / profileSum);

    const histMean = histogram.reduce((sum, val) => sum + val, 0) / histogram.length;
    const profMean = normalizedProfile.reduce((sum, val) => sum + val, 0) / normalizedProfile.length;

    let numerator = 0;
    let histVariance = 0;
    let profVariance = 0;

    for (let i = 0; i < 12; i++) {
        const histDiff = histogram[i] - histMean;
        const profDiff = normalizedProfile[i] - profMean;
        numerator += histDiff * profDiff;
        histVariance += histDiff * histDiff;
        profVariance += profDiff * profDiff;
    }

    const denominator = Math.sqrt(histVariance * profVariance);
    if (denominator === 0) return 0;

    return numerator / denominator;
}

function getKeyName(noteIndex: number, preferSharps: boolean): string {
    const flatKeys = [1, 3, 6, 8, 10];
    
    if (flatKeys.includes(noteIndex) && !preferSharps) {
        return NOTE_NAMES_FLAT[noteIndex];
    }
    
    return NOTE_NAMES[noteIndex];
}

export function resetAudioAnalysis(): void {
    pitchClassHistogram = new Array(12).fill(0);
    pitchClassWeights = new Array(12).fill(0);
    histogramUpdateCount = 0;
    previousLoudness = null;
    previousSpectralCentroid = null;
    previousMagnitudeSpectrum = null;
    currentKey = 'Detecting...';
    currentKeyConfidence = 0;
    keyStabilityCounter = 0;
}

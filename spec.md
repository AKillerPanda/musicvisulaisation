
## Overview
A web application that captures live audio from the user's microphone, analyzes it in real-time to extract musical features, displays these features as an interactive 3D visualization with color-coded musical notes, and automatically streams the audio using Livepeer for live streaming capabilities.

## Core Features

### Audio Capture and Analysis
- Capture live audio input from the user's microphone
- Request microphone permissions from the user
- Perform real-time audio analysis to extract:
  - ΔLoudness (change in loudness in decibels)
  - ΔSpectral Centroid (Hz difference or normalized)
  - Spectral Flux (signed)
  - Musical key information with enhanced, more accurate detection algorithm that is highly responsive in real-time scenarios and reliably identifies all major and minor keys, including sharps and flats
  - Individual musical note detection (C, D, E, F, G, A, B)
- Process audio continuously while the microphone is active
- Display detected musical key in real-time within the control panel with enhanced visual feedback
- Calculate delta values and spectral flux for 3D visualization mapping

### Live Streaming Integration
- Integrate Livepeer API for audio encoding and streaming using API key 'fc64e496-7b2e-4b32-96c0-56de02a517cb'
- Automatically start streaming when audio recording begins
- Encode live audio input using Livepeer's streaming capabilities
- Stream processed audio data through Livepeer infrastructure in real-time
- Handle Livepeer API authentication and stream management with the specified API key
- Backend manages Livepeer API calls and stream configuration using the configured API key
- Automatically stop streaming when audio recording stops

### 3D Visualization
- Display extracted audio features as points in a 3D space using React Three Fiber
- Map different audio characteristics to 3D coordinates:
  - ΔLoudness (change in loudness in decibels) mapped to the X axis
  - ΔSpectral Centroid (Hz difference or normalized) mapped to the Y axis
  - Spectral Flux (signed) mapped to the Z axis
  - Key information influencing color or size of points
- Color-code each point using a corrected, perfectly balanced color mapping system that ensures each detected note and key is assigned its exact corresponding color as defined in the legend:
  - All 24 keys (12 major and 12 minor) are represented with vibrant, distinct colors distributed evenly across the full color spectrum
  - Major keys: bright, rich, and vivid colors with maximum saturation and brightness
  - Minor keys: darker, less saturated colors that remain clearly visible against the black background
  - Each key has a unique, easily distinguishable color with no single hue dominating the spectrum
  - Fixed color distribution algorithm that guarantees each note/key gets its correct color from the legend regardless of detection frequency
  - Corrected color mapping logic that prevents any single color (like blue) from dominating when multiple notes are detected
- Implement corrected color conversion and hue distribution logic that ensures the 3D visualization uses the exact same color mapping as the legend
- Update visualization in real-time as new audio data is processed, reflecting changes in detected musical key with the corrected color mapping
- Allow user interaction with the 3D scene (rotation, zoom, pan)
- Each point remains visible on the graph for a user-configurable duration (1-10 seconds) before being automatically removed
- Manage point lifecycle to maintain smooth visualization performance with dynamic duration control
- Display only audio data points and axes without any grid background for a clean, minimal appearance
- Provide clearer, more immediate visual feedback when musical key is detected or changes

### Real-Time Key Detection Display
- Display a prominent, real-time indicator showing which keys are currently being detected
- Show the overall key the system is recognizing at any moment with a clear, visually prominent indicator
- Use color-coded badges that match the exact legend colors for each detected key
- Update the display smoothly and immediately as new keys are spotted
- Position the key detection display prominently in the interface for easy visibility
- Include both individual note detection and overall key recognition in the display
- Ensure the display updates in real-time without lag or delay
- Add visual indicator or badge to highlight when multiple notes are detected simultaneously
- Clearly show which notes are currently active with their corresponding correct colors from the legend
- Display multiple active notes with distinct color badges that match the legend exactly

### Musical Key Color Legend
- Display a comprehensive color legend positioned below the 3D visualization that shows all musical keys with their corresponding colors using the corrected, perfectly balanced color mapping system
- Include all 24 keys: 12 major keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) and 12 minor keys (Cm, C#m, Dm, D#m, Em, Fm, F#m, Gm, G#m, Am, A#m, Bm)
- Use the corrected color distribution that ensures no single hue dominates and all colors are vibrant and visibly distinct
- Display each key name alongside its corresponding color swatch for easy visual reference
- Organize the legend in a clear, readable format that matches the corrected color-coding system used in the 3D visualization
- Make the legend easily accessible and visible without obstructing the main visualization
- Ensure users can easily distinguish between all keys at a glance with the improved balanced color distribution
- Serve as the authoritative color reference that both the 3D visualization and real-time display must match exactly

### User Controls
- Start/stop microphone capture button (automatically starts/stops streaming)
- Visual indicator showing when microphone is active
- Visual indicator showing automatic streaming status
- Display current audio analysis values (ΔLoudness, ΔSpectral Centroid, Spectral Flux, key) with enhanced visual feedback for key detection and changes, making it easier for users to see which key is currently active
- Point visibility duration slider control (range 1-10 seconds) that allows users to set how long each point remains visible on the 3D graph before fading out

## Technical Requirements
- Audio processing and analysis performed in the frontend
- Backend handles Livepeer API integration and stream management using API key 'fc64e496-7b2e-4b32-96c0-56de02a517cb'
- Backend automatically initiates and terminates streaming sessions based on audio recording state
- Backend stores streaming session data and configuration
- Use Web Audio API for microphone access and audio analysis
- Implement comprehensive audio feature extraction algorithms in JavaScript including:
  - ΔLoudness calculation in decibels
  - ΔSpectral Centroid analysis (Hz difference or normalized)
  - Spectral Flux calculation (signed)
  - Enhanced, more accurate and responsive musical key detection algorithm for all major and minor keys, sharps, and flats, optimized for real-time scenarios
  - Individual musical note detection algorithms to identify specific notes (C, D, E, F, G, A, B)
- 3D rendering using React Three Fiber
- Enhanced real-time key detection updates reflected in both the control panel display and 3D visualization with improved visual feedback
- Dynamic point management system with user-configurable visibility duration (1-10 seconds) per point
- Corrected color mapping system with fixed color assignment logic that ensures each note/key gets its exact corresponding color from the legend
- Fixed color distribution algorithm that prevents any single color from dominating regardless of detection patterns
- Livepeer SDK integration for automatic streaming functionality with the specified API key
- Enhanced visual feedback system for key detection and changes in both control panel and visualization components
- Color legend component that displays all 24 musical keys with their corresponding corrected, balanced color mapping
- User-configurable point visibility duration control with slider interface
- Corrected color conversion and hue distribution logic that guarantees consistent color mapping across all components
- Real-time key detection display component with color-coded badges that exactly match the legend colors
- Multiple note detection indicator that shows all currently active notes with their proper colors
- Smooth, immediate updates for key detection display without lag
- Unified color mapping system that ensures the legend, 3D visualization, and real-time display all use identical colors for each note/key
-Posted using caffeine.ai- 'https://musicvisual-201.caffeine.xyz/'

## User Interface
- Clean, modern interface with the 3D visualization as the main focus
- Control panel for microphone controls and current audio data display, including real-time musical key information with enhanced visual feedback for key detection and changes
- Prominent real-time key detection display showing currently detected keys with color-coded badges that exactly match the legend
- Clear indicator for the overall key being recognized at any moment
- Visual indicator or badge highlighting when multiple notes are detected simultaneously with proper color coding
- Automatic streaming status indicator showing live streaming is active when recording
- Point visibility duration slider control (1-10 seconds range) for user customization of how long points remain visible
- Updated labels and tooltips reflecting new axis mappings:
  - X axis: ΔLoudness (change in loudness in decibels)
  - Y axis: ΔSpectral Centroid (Hz difference or normalized)
  - Z axis: Spectral Flux (signed)
- Comprehensive musical key color legend positioned below the 3D visualization, showing all 24 keys with the corrected, perfectly balanced color distribution that ensures easy distinction between all keys at a glance
- Enhanced visual feedback in both control panel and 3D visualization when musical key is detected or changes, using the corrected color mapping system that matches the legend exactly
- Responsive design for different screen sizes
- Application content in English

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AudioPoint {
    x: number;
    y: number;
    z: number;
    color: string;
    timestamp: number;
}

interface AudioPointsProps {
    points: AudioPoint[];
    pointDuration: number;
}

export default function AudioPoints({ points, pointDuration }: AudioPointsProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
        }
    });

    const currentTime = Date.now();

    return (
        <group ref={groupRef}>
            {points.map((point, index) => {
                const ageInMs = currentTime - point.timestamp;
                const ageInSeconds = ageInMs / 1000;
                
                const opacity = Math.max(0.3, 1 - (ageInSeconds / pointDuration));
                const size = 0.1 + (1 - (ageInSeconds / pointDuration)) * 0.2;

                const colorMatch = point.color.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
                let threeColor = new THREE.Color(point.color);
                
                if (colorMatch) {
                    const [, l, c, h] = colorMatch;
                    const hue = parseFloat(h) / 360;
                    const chroma = parseFloat(c);
                    const lightness = parseFloat(l);
                    
                    // Enhanced OKLCH to HSL conversion with optimized saturation mapping
                    // Uses 2.4x multiplier to ensure all note colors are vivid and distinct
                    // This ensures each detected note appears in its proper, vibrant color
                    const saturation = Math.min(1, chroma * 2.4);
                    
                    threeColor.setHSL(hue, saturation, lightness);
                }

                return (
                    <mesh key={`${point.timestamp}-${index}`} position={[point.x, point.y, point.z]}>
                        <sphereGeometry args={[size, 16, 16]} />
                        <meshStandardMaterial
                            color={threeColor}
                            transparent
                            opacity={opacity}
                            emissive={threeColor}
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const InteractiveWaveShader = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | undefined>(undefined);

  // React state to control shader uniforms
  const [hasActive, setHasActive] = useState(false);
  const [hasUpcoming, setHasUpcoming] = useState(false);
  const [dimmingDisabled, setDimmingDisabled] = useState(true);

  // Update shader uniforms when state changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasActiveReminders.value = hasActive;
    }
  }, [hasActive]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasUpcomingReminders.value = hasUpcoming;
    }
  }, [hasUpcoming]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.disableCenterDimming.value = dimmingDisabled;
    }
  }, [dimmingDisabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Renderer + Scene + Camera + Clock
    let renderer: THREE.WebGLRenderer;
    try {
      // Use alpha:false for a standard opaque background
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.error("WebGL not supported", err);
      container.innerHTML =
        '<p style="color:white;text-align:center;">Sorry, WebGL isn’t available.</p>';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const startTime = performance.now();

    // 2) Shaders
    const vertexShader = `
      varying vec2 vTextureCoord;
      void main() {
        vTextureCoord = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform bool hasActiveReminders;
      uniform bool hasUpcomingReminders;
      uniform bool disableCenterDimming;
      varying vec2 vTextureCoord;

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

        // Calculate distance from center for dimming the center
        vec2 center = iResolution.xy * 0.5;
        float dist = distance(fragCoord, center);
        float radius = min(iResolution.x, iResolution.y) * 0.5;
        
        // Create a dimming factor for the center area (30% of the radius)
        float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

        for(float i = 1.0; i < 10.0; i++){
          uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
          uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
        }
        
        // Determine color based on Dark Purple, Wisteria, and Sunglow palette
        if (hasActiveReminders) {
          // Sunglow (#FFD166) golden glow
          fragColor = vec4(vec3(0.85, 0.65, 0.25) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        } else if (hasUpcomingReminders) {
          // Wisteria (#BC96E6) purple wave
          fragColor = vec4(vec3(0.55, 0.35, 0.75) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        } else {
          // Dark Purple + Wisteria ambient mix (#210B2C & #BC96E6)
          fragColor = vec4(vec3(0.32, 0.12, 0.45) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        }
        
        // Apply center dimming only if not disabled
        if (!disableCenterDimming) {
          fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
        }
      }

      void main() {
        vec4 color;
        mainImage(color, vTextureCoord * iResolution);
        gl_FragColor = color;
      }
    `;

    // 3) Material, Geometry, Mesh
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      hasActiveReminders: { value: hasActive },
      hasUpcomingReminders: { value: hasUpcoming },
      disableCenterDimming: { value: dimmingDisabled },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    materialRef.current = material;
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 4) Resize and Mouse Move Handlers
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    const onMouseMove = (event: MouseEvent) => {
      uniforms.iMouse.value.set(event.clientX, event.clientY);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    onResize();

    // 5) Animation Loop
    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    });

    // 6) Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      const canvas = renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, [hasActive, hasUpcoming, dimmingDisabled]);

  const buttonStyle: React.CSSProperties = {
    padding: "8px 14px",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    color: "#e2e8f0",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          backgroundColor: "#13061b",
          overflow: "hidden",
          opacity: 0.5,
          pointerEvents: "none",
        }}
        aria-label="Interactive wave shader background"
      />
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "24px",
          zIndex: 20,
          backgroundColor: "rgba(9, 13, 25, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "6px 10px",
          borderRadius: "14px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, paddingRight: "4px" }}>
          Shader Mode:
        </span>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: hasActive ? "#0284c7" : "rgba(15, 23, 42, 0.7)",
            borderColor: hasActive ? "#38bdf8" : "rgba(255,255,255,0.15)",
          }}
          onClick={() => setHasActive(!hasActive)}
        >
          Cyan Wave
        </button>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: hasUpcoming ? "#166534" : "rgba(15, 23, 42, 0.7)",
            borderColor: hasUpcoming ? "#4ade80" : "rgba(255,255,255,0.15)",
          }}
          onClick={() => setHasUpcoming(!hasUpcoming)}
        >
          Emerald Glow
        </button>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: !dimmingDisabled ? "#991b1b" : "rgba(15, 23, 42, 0.7)",
            borderColor: !dimmingDisabled ? "#f87171" : "rgba(255,255,255,0.15)",
          }}
          onClick={() => setDimmingDisabled(!dimmingDisabled)}
        >
          {dimmingDisabled ? "Enable Vignette" : "Vignette Active"}
        </button>
      </div>
    </>
  );
};

export default InteractiveWaveShader;

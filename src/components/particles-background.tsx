"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
  type ISourceOptions,
} from "@tsparticles/engine";
import { loadFull } from "tsparticles";

const ParticlesBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
        await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
        fpsLimit: 60,
        interactivity: {
            events: {
                onHover: {
                    enable: true,
                    mode: "repulse",
                },
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.4,
                    speed: 0.1
                },
            },
        },
        particles: {
            color: {
                value: ["#003459", "#007ea7", "#00a8e8"],
            },
            links: {
                enable: false,
            },
            move: {
                direction: "none",
                enable: true,
                outModes: {
                    default: "out",
                },
                random: true,
                speed: 0.2,
                straight: false,
            },
            number: {
                density: {
                    enable: true,
                    area: 1200,
                },
                value: 15,
            },
            opacity: {
                value: {min: 0.1, max: 0.3},
                 animation: {
                    enable: true,
                    speed: 0.5,
                    minimumValue: 0.1,
                },
            },
            shape: {
                type: "circle",
            },
            size: {
                value: { min: 100, max: 200 },
                 animation: {
                    enable: true,
                    speed: 3,
                    minimumValue: 80,
                },
            },
        },
        detectRetina: true,
        fullScreen: {
            enable: true,
            zIndex: -1
        }
    }),
    [],
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
      />
    );
  }

  return null;
};

export default ParticlesBackground;
